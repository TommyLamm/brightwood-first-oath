from __future__ import annotations
import hashlib, json, sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
name, frame_id = sys.argv[1:3]
source = root / "raw" / name
normalized = root / "normalized" / name
review = root / "review" / (Path(name).stem + "-q70.jpg")
img = Image.open(source).convert("RGBA")
a = img.getchannel("A")
visible = a.point(lambda v: 255 if v > 8 else 0)
bbox = visible.getbbox()
if bbox is None: raise SystemExit("rejected: empty alpha")
x0,y0,x1,y1 = bbox
edge_counts = {"left":sum(a.getpixel((0,y))>8 for y in range(img.height)),"top":sum(a.getpixel((x,0))>8 for x in range(img.width)),"right":sum(a.getpixel((img.width-1,y))>8 for y in range(img.height)),"bottom":sum(a.getpixel((x,img.height-1))>8 for x in range(img.width))}
margin=max(2,round(max(x1-x0,y1-y0)*0.035))
crop_box=(max(0,x0-margin),max(0,y0-margin),min(img.width,x1+margin),min(img.height,y1+margin))
crop=img.crop(crop_box)
scale=min(90/crop.width,76/crop.height)
w,h=max(1,round(crop.width*scale)),max(1,round(crop.height*scale))
resized=crop.resize((w,h),Image.Resampling.LANCZOS)
ra=resized.getchannel("A")
rb=ra.point(lambda v:255 if v>8 else 0).getbbox()
if rb is None: raise SystemExit("rejected: resized alpha is empty")
rl,rt,rr,rbottom=rb
visible_w=rr-rl
source_center=(rl+rr-1)/2
target_center=48 if visible_w%2 else 47.5
paste_x=round(target_center-source_center)
paste_y=93-rbottom
out=Image.new("RGBA",(96,96),(0,0,0,0))
out.alpha_composite(resized,(paste_x,paste_y))
na=out.getchannel("A")
nb=na.point(lambda v:255 if v>8 else 0).getbbox()
if nb is None: raise SystemExit("rejected: normalized output is empty")
l,t,r,b=nb
if l<3 or t<3 or r>93 or b>93 or b-1!=92 or abs(((l+r-1)/2)-target_center)>0.5:
    raise SystemExit(f"rejected: normalized bounds {nb} violate padding/center/baseline")
out.save(normalized,optimize=True)
matte=Image.new("RGBA",img.size,(223,227,219,255));matte.alpha_composite(img)
if max(img.size)>1280:
    s=1280/max(img.size);matte=matte.resize((round(img.width*s),round(img.height*s)),Image.Resampling.LANCZOS)
matte.convert("RGB").save(review,"JPEG",quality=70,optimize=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
print(json.dumps({"frameId":frame_id,"raw":str(source.relative_to(root)).replace('\\','/'),"rawSize":img.size,"rawSha256":sha(source),"sourceAlphaBBoxGt8":bbox,"sourceEdgeVisiblePixelsGt8":edge_counts,"cropIncludingMargin":crop_box,"resizedCrop":(w,h),"normalized":str(normalized.relative_to(root)).replace('\\','/'),"normalizedSize":out.size,"normalizedAlphaBBoxGt8":nb,"normalizedSha256":sha(normalized),"review":str(review.relative_to(root)).replace('\\','/'),"reviewSize":matte.size,"reviewFormat":"JPEG","reviewQuality":70,"reviewMatteRGB":[223,227,219]},ensure_ascii=False))
