"""Extract generated pixels, encode WebP and measure coin-rim caption geometry."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets'
def trim(im):
    box=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
    if not box: raise ValueError('Empty artwork')
    return im.crop(box)
def fit(im,w,h):
    scale=min(w/im.width,h/im.height)
    return im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
def split(im):
    im=trim(im.convert('RGBA')); alpha=im.getchannel('A'); gaps=[]; start=None
    for x in range(im.width):
        used=alpha.crop((x,0,x+1,im.height)).getextrema()[1]>16
        if not used and start is None:start=x
        if used and start is not None:
            if start>im.width*.2 and x<im.width*.8:gaps.append((x-start,(x+start)//2))
            start=None
    if not gaps:raise ValueError('Figures must be separated')
    _,x=max(gaps)
    return trim(im.crop((0,0,x,im.height))),trim(im.crop((x,0,im.width,im.height)))
metadata={}
for variant,source in [('before',ASSETS/'reference/current.png'),('a',ASSETS/'a-source.png'),('b',ASSETS/'b-source.png')]:
    if not source.exists():continue
    im=Image.open(source).convert('RGBA')
    if im.getchannel('A').getextrema()[0]==255:raise ValueError('Opaque background')
    coin,receipt=split(im)
    pair=Image.new('RGBA',(1050,650))
    for art,cx in [(coin,270),(receipt,790)]:
        art=fit(art,460,560); pair.alpha_composite(art,(cx-art.width//2,610-art.height))
    pair.save(ASSETS/f'{variant}.webp',lossless=True)
    canvas=Image.new('RGBA',(600,630)); c=fit(coin,570,600)
    canvas.alpha_composite(c,((600-c.width)//2,615-c.height))
    canvas.save(ASSETS/f'coin-{variant}.webp',lossless=True)
    receipt.save(ASSETS/f'kvitya-{variant}.webp',lossless=True)
    # Bounding box of gold coin material, excluding pale hands and cream face.
    pixels=canvas.load(); points=[]
    for y in range(canvas.height):
        for x in range(canvas.width):
            r,g,b,a=pixels[x,y]
            if a>150 and r>120 and g>70 and g>r*.42 and b<r*.52:points.append((x,y))
    if not points:raise ValueError('No gold rim found')
    left,right=min(x for x,y in points),max(x for x,y in points)
    top,bottom=min(y for x,y in points),max(y for x,y in points)
    cx,cy=(left+right)/2,(top+bottom)/2
    radius=min(right-left,bottom-top)/2
    metadata[variant]={'cx':round(cx/3,2),'cy':round(cy/3,2),'r':round(radius*.81/3,2)}
    # A circular format crop keeps the original coin pixels and excludes limbs.
    # Tight face/rim crop: hands can overlap the outside of the full coin disc.
    extent=round(radius*.76)
    avatar=canvas.crop((round(cx)-extent,round(cy)-extent,round(cx)+extent,round(cy)+extent))
    mask=Image.new('L',avatar.size)
    ImageDraw.Draw(mask).ellipse((0,0,avatar.width-1,avatar.height-1),fill=255)
    avatar.putalpha(ImageChops.multiply(avatar.getchannel('A'),mask))
    fit(avatar,256,256).save(ASSETS/f'coin-{variant}-avatar.webp',lossless=True)
    # Header cutout from the same generated paper body; HTML holds actual amounts.
    top_band=receipt.getchannel('A').crop((0,0,receipt.width,round(receipt.height*.15))).point(lambda a:255 if a>16 else 0).getbbox()
    header=receipt.crop((top_band[0],0,top_band[2],round(receipt.height*.4)))
    header.save(ASSETS/f'kvitya-{variant}-head.webp',lossless=True)
    print(f'OK {variant}: two separate complete figures; caption geometry {metadata[variant]}')
(ROOT/'geometry.js').write_text('window.MASCOT_GEOMETRY = '+json.dumps(metadata)+';\n')
(ROOT/'art-processing.json').write_text(json.dumps(metadata,indent=2)+'\n')
