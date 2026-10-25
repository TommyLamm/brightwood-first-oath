from pathlib import Path
from PIL import Image
import numpy as np
src=Path('art-source/ruins-a/actors/generated/moss-carapace-idle-anchor-generated-v1.png')
out=Path('art-source/ruins-a/actors/moss-carapace-idle-anchor-v1-mirrored-right.png')
im=Image.open(src).convert('RGBA')
a=np.asarray(im.getchannel('A'))
ys,xs=np.where(a>8)
if not len(xs): raise SystemExit('No visible subject in anchor')
margin=2
x0=max(0,int(xs.min())-margin); y0=max(0,int(ys.min())-margin)
x1=min(im.width,int(xs.max())+1+margin); y1=min(im.height,int(ys.max())+1+margin)
crop=im.crop((x0,y0,x1,y1))
max_w,max_h=88,58
scale=min(max_w/crop.width,max_h/crop.height)
w=max(1,round(crop.width*scale)); h=max(1,round(crop.height*scale))
resized=crop.resize((w,h),Image.Resampling.LANCZOS).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
frame=Image.new('RGBA',(96,96),(0,0,0,0))
frame.alpha_composite(resized,((96-w)//2,96-h))
frame.save(out,optimize=True)
preview=Image.new('RGBA',frame.size,(220,228,215,255)); preview.alpha_composite(frame)
preview.resize((576,576),Image.Resampling.NEAREST).convert('RGB').save('art-source/ruins-a/actors/review/moss-carapace-idle-anchor-mirrored-right-review.jpg',quality=70,optimize=True)
print({'source':str(src),'sourceSize':im.size,'crop':(x0,y0,x1,y1),'normalizationScale':round(scale,4),'frameSize':frame.size,'subjectBoxInFrame':((96-w)//2,96-h,(96-w)//2+w-1,95),'alpha':frame.getchannel('A').getextrema(),'saved':str(out)})
