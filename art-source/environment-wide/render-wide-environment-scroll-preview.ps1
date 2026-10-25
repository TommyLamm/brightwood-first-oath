param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$envRoot=Join-Path $ProjectRoot 'public\assets\environment'
$outDir=Join-Path $PSScriptRoot 'metrics'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outPath=Join-Path $outDir 'combined-scroll-preview-20261024.jpg'
$positionsPath=Join-Path $outDir 'scroll-preview-map-positions-20261024.csv'
$windowWidth=960
$windowHeight=540
$cellWidth=384
$cellHeight=216
$margin=16
$columnGap=8
$topHeight=62
$rowLabelHeight=24
$sampleLabelHeight=18
$rowGap=10
$footerHeight=40
$sheetWidth=$margin*2+$cellWidth*3+$columnGap*2
$rowHeight=$rowLabelHeight+$sampleLabelHeight+$cellHeight+$rowGap
$maps=@(
  [pscustomobject]@{id='camp';theme='camp';width=1440},
  [pscustomobject]@{id='town';theme='town';width=1920},
  [pscustomobject]@{id='forest-edge';theme='forest';width=1920},
  [pscustomobject]@{id='mushroom-wood';theme='forest';width=2160},
  [pscustomobject]@{id='red-ridge';theme='rock';width=2160},
  [pscustomobject]@{id='mine-gate';theme='rock';width=1920},
  [pscustomobject]@{id='guardian-arena';theme='rock';width=1440},
  [pscustomobject]@{id='frost-shore';theme='frost';width=1920},
  [pscustomobject]@{id='frost-pine-pass';theme='frost-pine';width=2160},
  [pscustomobject]@{id='frost-tide-cavern';theme='frost-cave';width=2160},
  [pscustomobject]@{id='sand-glass-shore';theme='sand';width=1920},
  [pscustomobject]@{id='sand-dune-pass';theme='sand-dune';width=2600},
  [pscustomobject]@{id='sand-sunwell-basin';theme='sunwell';width=2800},
  [pscustomobject]@{id='sand-sunwell-altar';theme='sunwell';width=1400}
)
$atmosphere=@{
  'mushroom-wood'=@{color=0x1d3a2c;alpha=0.22}
  'mine-gate'=@{color=0x1c2233;alpha=0.26}
  'guardian-arena'=@{color=0x3b1222;alpha=0.30}
}
$headerHeight=62
$sheetHeight=$topHeight+$maps.Count*$rowHeight+$footerHeight
$sheet=[System.Drawing.Bitmap]::new($sheetWidth,$sheetHeight,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g=[System.Drawing.Graphics]::FromImage($sheet)
$g.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceOver
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::None
$g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(255,17,22,29))
$titleFont=[System.Drawing.Font]::new('Segoe UI',15,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$bodyFont=[System.Drawing.Font]::new('Segoe UI',10,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$labelFont=[System.Drawing.Font]::new('Segoe UI',9,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$white=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255,239,241,244))
$muted=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255,167,178,190))
$positions=[System.Collections.Generic.List[object]]::new()
try {
  $g.DrawString('Environment backgrounds · map scroll windows',$titleFont,$white,16,9)
  $g.DrawString('14 maps | 960×540 | sky fixed | far offset 0.2× scroll | mid offset 0.5× scroll | Sunwell far 1.6× bottom anchored',$bodyFont,$muted,16,34)
  $row=0
  foreach($map in $maps) {
    $maxScroll=[Math]::Max(0,$map.width-$windowWidth)
    $midScroll=[int][Math]::Floor($maxScroll/2+0.5)
    $samples=@(
      [pscustomobject]@{label='START';scroll=0},
      [pscustomobject]@{label='MIDPOINT';scroll=$midScroll},
      [pscustomobject]@{label='MAX';scroll=$maxScroll}
    )
    $rowY=$topHeight+$row*$rowHeight
    $g.DrawString("$($map.id)  ·  theme $($map.theme)  ·  world $($map.width)px  ·  maxScroll $($maxScroll)px",$bodyFont,$white,16,$rowY)
    $skyPath=Join-Path $envRoot "env-$($map.theme)-sky-v1.png"
    $farPath=Join-Path $envRoot "env-$($map.theme)-far-v2.png"
    $midPath=Join-Path $envRoot "env-$($map.theme)-mid-v2.png"
    foreach($path in @($skyPath,$farPath,$midPath)) { if(-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing image: $path" } }
    $sky=[System.Drawing.Bitmap]::FromFile($skyPath)
    $far=[System.Drawing.Bitmap]::FromFile($farPath)
    $mid=[System.Drawing.Bitmap]::FromFile($midPath)
    try {
      if($sky.Width -le 0 -or $sky.Height -le 0) { throw "Invalid sky size for $($map.id): $($sky.Width)x$($sky.Height)" }
      if($far.Width -ne 1440 -or $far.Height -ne $windowHeight) { throw "Unexpected far size for $($map.id): $($far.Width)x$($far.Height)" }
      if($mid.Width -ne 1920 -or $mid.Height -ne $windowHeight) { throw "Unexpected mid size for $($map.id): $($mid.Width)x$($mid.Height)" }
      $column=0
      foreach($sample in $samples) {
        $farOffset=[int][Math]::Floor($sample.scroll*0.2+0.5)
        $midOffset=[int][Math]::Floor($sample.scroll*0.5+0.5)
        $positions.Add([pscustomobject]@{map=$map.id;theme=$map.theme;worldWidth=$map.width;maxScroll=$maxScroll;cameraScrollX=$sample.scroll;farOffset=$farOffset;midOffset=$midOffset})
        $frame=[System.Drawing.Bitmap]::new($windowWidth,$windowHeight,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $fg=[System.Drawing.Graphics]::FromImage($frame)
        try {
          $fg.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceOver
          $fg.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
          $fg.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
          $fg.Clear([System.Drawing.Color]::FromArgb(255,14,18,24))
          $skyDest=[System.Drawing.Rectangle]::new(0,0,$windowWidth,$windowHeight); $skySource=[System.Drawing.Rectangle]::new(0,0,$sky.Width,$sky.Height); $fg.DrawImage($sky,$skyDest,$skySource,[System.Drawing.GraphicsUnit]::Pixel)
          $farY=0
          $farHeight=$windowHeight
          if($map.theme -eq 'sunwell') {
            $farHeight=[int]($windowHeight*1.6)
            $farY=$windowHeight-$farHeight
          }
          $farRect=[System.Drawing.Rectangle]::new(-$farOffset,$farY,$far.Width,$farHeight)
          $farSource=[System.Drawing.Rectangle]::new(0,0,$far.Width,$far.Height)
          $fg.DrawImage($far,$farRect,0,0,$far.Width,$far.Height,[System.Drawing.GraphicsUnit]::Pixel)
          $midRect=[System.Drawing.Rectangle]::new(-$midOffset,0,$mid.Width,$mid.Height)
          $fg.DrawImage($mid,$midRect,0,0,$mid.Width,$mid.Height,[System.Drawing.GraphicsUnit]::Pixel)
          if($atmosphere.ContainsKey($map.id)) {
            $wash=$atmosphere[$map.id]
            $red=($wash.color -shr 16) -band 255
            $green=($wash.color -shr 8) -band 255
            $blue=$wash.color -band 255
            $alpha=[int][Math]::Round($wash.alpha*255)
            $brush=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($alpha,$red,$green,$blue))
            try { $fg.FillRectangle($brush,0,0,$windowWidth,$windowHeight) } finally { $brush.Dispose() }
          }
          $cellX=$margin+$column*($cellWidth+$columnGap)
          $cellY=$rowY+$rowLabelHeight+$sampleLabelHeight
          $dest=[System.Drawing.Rectangle]::new($cellX,$cellY,$cellWidth,$cellHeight)
          $fgTarget=[System.Drawing.Rectangle]::new(0,0,$windowWidth,$windowHeight)
          $g.DrawImage($frame,$dest,$fgTarget,[System.Drawing.GraphicsUnit]::Pixel)
        } finally {
          $fg.Dispose()
          $frame.Dispose()
        }
        $cellX=$margin+$column*($cellWidth+$columnGap)
        $labelY=$rowY+$rowLabelHeight
        $label="$($sample.label)  x=$($sample.scroll)  far=$farOffset  mid=$midOffset"
        $g.DrawString($label,$labelFont,$muted,$cellX,$labelY)
        $column++
      }
    } finally {
      $sky.Dispose()
      $far.Dispose()
      $mid.Dispose()
    }
    $row++
  }
  $footerY=$topHeight+$maps.Count*$rowHeight
  $g.DrawString('Offline source composite for asset review; current runtime still pins background layers. Not runtime parallax verification.',$labelFont,$muted,16,$footerY+10)
  $codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
  $parameters=[System.Drawing.Imaging.EncoderParameters]::new(1)
  $parameters.Param[0]=[System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]70)
  try { $sheet.Save($outPath,$codec,$parameters) } finally { $parameters.Dispose() }
  $positions | Export-Csv -LiteralPath $positionsPath -NoTypeInformation -Encoding utf8
  Write-Output "Preview: $outPath"
  Write-Output "Dimensions: $($sheet.Width)x$($sheet.Height) (JPEG quality 70)"
  Write-Output "Scroll samples: $($positions.Count); positions: $positionsPath"
} finally {
  $g.Dispose()
  $sheet.Dispose()
  $titleFont.Dispose()
  $bodyFont.Dispose()
  $labelFont.Dispose()
  $white.Dispose()
  $muted.Dispose()
}

