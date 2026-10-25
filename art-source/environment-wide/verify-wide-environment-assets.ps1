param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$manifestPath = Join-Path $ProjectRoot 'public\assets\environment\manifest.json'
$baselinePath = Join-Path $PSScriptRoot 'reference-baseline\manifest-before-v2-wide-backgrounds.json'
$metricsDir = Join-Path $PSScriptRoot 'metrics'
$metricsPath = Join-Path $metricsDir 'wide-environment-assets.csv'
New-Item -ItemType Directory -Force -Path $metricsDir | Out-Null

$before = Get-Content -Raw -LiteralPath $baselinePath | ConvertFrom-Json
$current = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$errors = [System.Collections.Generic.List[string]]::new()
$records = [System.Collections.Generic.List[object]]::new()

function ConvertToCompactJson {
  param($Value)
  ConvertTo-Json -InputObject $Value -Depth 32 -Compress
}

foreach ($field in @('version','pack','animations','audio')) {
  if ((ConvertToCompactJson $before.$field) -cne (ConvertToCompactJson $current.$field)) {
    $errors.Add("Top-level manifest field changed unexpectedly: $field")
  }
}
if ($before.images.Count -ne $current.images.Count) {
  $errors.Add("Manifest image count changed: before=$($before.images.Count), current=$($current.images.Count)")
}

$pattern = '^env:([^:]+):(far|mid)$'
$beforeByKey = @{}
$currentByKey = @{}
foreach ($image in $before.images) { $beforeByKey[$image.key] = $image }
foreach ($image in $current.images) { $currentByKey[$image.key] = $image }
$beforeKeys = (($beforeByKey.Keys | Sort-Object) -join "`n")
$currentKeys = (($currentByKey.Keys | Sort-Object) -join "`n")
if ($beforeKeys -cne $currentKeys) { $errors.Add('Manifest key set changed unexpectedly') }
$targets = @($current.images | Where-Object { $_.key -match $pattern })
if ($targets.Count -ne 20) { $errors.Add("Expected 20 far/mid entries, found $($targets.Count)") }

foreach ($image in $current.images) {
  $key = [string]$image.key
  if (-not $beforeByKey.ContainsKey($key)) { continue }
  $old = $beforeByKey[$key]
  $targetMatch = [regex]::Match($key,$pattern)
  $isTarget = $targetMatch.Success
  $oldNames = (($old.PSObject.Properties.Name | Sort-Object) -join "`n")
  $newNames = (($image.PSObject.Properties.Name | Sort-Object) -join "`n")
  if ($oldNames -cne $newNames) { $errors.Add("Manifest fields changed unexpectedly: $key") }
  foreach ($property in $old.PSObject.Properties.Name) {
    if ($isTarget -and $property -in @('url','displayWidth')) { continue }
    if ((ConvertToCompactJson $old.$property) -cne (ConvertToCompactJson $image.$property)) {
      $errors.Add("Unexpected manifest field change: $key.$property")
    }
  }
  if (-not $isTarget) { continue }

  $theme = $targetMatch.Groups[1].Value
  $layer = $targetMatch.Groups[2].Value
  $expectedWidth = if ($layer -eq 'far') { 1440 } else { 1920 }
  $expectedUrl = "assets/environment/env-$theme-$layer-v2.png"
  if ($image.url -cne $expectedUrl) { $errors.Add("Unexpected v2 URL for ${key}: $($image.url)") }
  if ($image.displayWidth -ne $expectedWidth -or $image.displayHeight -ne 540) {
    $errors.Add("Unexpected manifest display size for ${key}: $($image.displayWidth)x$($image.displayHeight)")
  }

  $relative = ([string]$image.url).Replace('/','\')
  $assetPath = Join-Path (Join-Path $ProjectRoot 'public') $relative
  if (-not (Test-Path -LiteralPath $assetPath -PathType Leaf)) {
    $errors.Add("Missing asset for ${key}: $assetPath")
    $records.Add([pscustomobject]@{key=$key;url=[string]$image.url;path=$assetPath;width='';height='';pixelFormat='missing';bytes=0;bottomRowNonzeroAlphaPixels='';bottomRowAlphaMin='';bottomRowAlphaMax='';nonzeroAlphaBelowY180=''})
    continue
  }

  $file = Get-Item -LiteralPath $assetPath
  $bitmap = [System.Drawing.Bitmap]::FromFile($assetPath)
  $width = $bitmap.Width
  $height = $bitmap.Height
  $pixelFormat = $bitmap.PixelFormat.ToString()
  if ($width -ne $expectedWidth -or $height -ne 540) { $errors.Add("Unexpected file dimensions for ${key}: ${width}x${height}") }
  if ($pixelFormat -ne 'Format32bppArgb') { $errors.Add("Expected real RGBA/Format32bppArgb for ${key}, got $pixelFormat") }

  $bottomNonzero = ''
  $bottomMin = ''
  $bottomMax = ''
  $below180 = ''
  $data = $null
  try {
    $rect = [System.Drawing.Rectangle]::new(0,0,$width,$height)
    $data = $bitmap.LockBits($rect,[System.Drawing.Imaging.ImageLockMode]::ReadOnly,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $rowBytes = [Math]::Abs($data.Stride)
    $buffer = New-Object byte[] ($rowBytes*$height)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0,$buffer,0,$buffer.Length)
    $bottomOffset = if ($data.Stride -ge 0) { ($height-1)*$rowBytes } else { 0 }
    $bottomNonzero = 0
    $bottomMin = 255
    $bottomMax = 0
    for ($x=0; $x -lt $width; $x++) {
      $alpha = $buffer[$bottomOffset+$x*4+3]
      if ($alpha -gt 0) { $bottomNonzero++ }
      if ($alpha -lt $bottomMin) { $bottomMin = $alpha }
      if ($alpha -gt $bottomMax) { $bottomMax = $alpha }
    }
    if ($layer -eq 'mid') {
      $below180 = 0
      for ($y=180; $y -lt $height; $y++) {
        $offset = if ($data.Stride -ge 0) { $y*$rowBytes } else { ($height-1-$y)*$rowBytes }
        for ($x=0; $x -lt $width; $x++) { if ($buffer[$offset+$x*4+3] -gt 0) { $below180++ } }
      }
      if ($below180 -ne 0) { $errors.Add("Mid art extends below y=180 for ${key}: $below180 nontransparent pixels") }
    }
  }
  catch {
    $errors.Add("Alpha scan failed for ${key}: $($_.Exception.Message)")
  }
  finally {
    if ($null -ne $data) { $bitmap.UnlockBits($data) }
    $bitmap.Dispose()
  }
  $records.Add([pscustomobject]@{key=$key;url=[string]$image.url;path=$assetPath;width=$width;height=$height;pixelFormat=$pixelFormat;bytes=$file.Length;bottomRowNonzeroAlphaPixels=$bottomNonzero;bottomRowAlphaMin=$bottomMin;bottomRowAlphaMax=$bottomMax;nonzeroAlphaBelowY180=$below180})
}

$records | Export-Csv -LiteralPath $metricsPath -NoTypeInformation -Encoding utf8
$records | Format-Table key,width,height,pixelFormat,bytes,bottomRowNonzeroAlphaPixels,nonzeroAlphaBelowY180 -AutoSize
if ($errors.Count -gt 0) {
  $errors | ForEach-Object { [Console]::Error.WriteLine($_) }
  throw "Environment-wide validation failed with $($errors.Count) issue(s). Metrics: $metricsPath"
}
Write-Output "Validated 20 far/mid manifest references. Metrics: $metricsPath"