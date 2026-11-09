"""Extract generated pose groups and register every coin by its physical rim."""
from pathlib import Path
import importlib.util
import json
from PIL import Image, ImageChops, ImageDraw

ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets'
HELPER=Path('C:/Users/Aleksei Iakunichkin/.codex/plugins/cache/openai-curated-remote/work-pets/0.1.6/skills/create-pet/scripts/extract_strip_frames.py')
spec=importlib.util.spec_from_file_location('pose_components',HELPER)
components=importlib.util.module_from_spec(spec);spec.loader.exec_module(components)

def trim(im):
    box=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
    if box is None:raise ValueError('Empty pose')
    return im.crop(box)

def gold_geometry(im):
    mask=Image.new('RGBA',im.size)
    alpha=bytearray(im.width*im.height)
    for i,(r,g,b,a) in enumerate(im.getdata()):
        if a>128 and r>120 and g>70 and g>r*.42 and b<r*.52:alpha[i]=255
    mask.putalpha(Image.frombytes('L',im.size,bytes(alpha)))
    groups=components.connected_components(mask)
    if not groups:raise ValueError('No physical gold rim found')
    box=max(groups,key=lambda x:x['area'])['bbox']
    l,t,r,b=box
    if max(r-l,b-t)/min(r-l,b-t)>1.18:raise ValueError(f'Coin rim not circular: {box}')
    return (l+r)/2,(t+b)/2,((r-l)+(b-t))/4

def coin(name,im):
    im=trim(im);cx,cy,r=gold_geometry(im)
    scale=220/r
    art=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    x,y=round(360-cx*scale),round(350-cy*scale)
    if min(x,y)<0 or x+art.width>720 or y+art.height>840:raise ValueError(f'{name}: pose clipped after common rim registration {(x,y,art.size)}')
    canvas=Image.new('RGBA',(720,840));canvas.alpha_composite(art,(x,y))
    canvas.save(ASSETS/f'coin-state-{name}.webp',lossless=True)
    # Keep a purple ring around the face, with no hand fragments.
    extent=198
    face=canvas.crop((360-extent,350-extent,360+extent,350+extent))
    mask=Image.new('L',face.size);ImageDraw.Draw(mask).ellipse((0,0,face.width-1,face.height-1),fill=255)
    face.putalpha(ImageChops.multiply(face.getchannel('A'),mask))
    face.resize((160,160),Image.Resampling.LANCZOS).save(ASSETS/f'coin-state-{name}-avatar.webp',lossless=True)
    return {'file':f'coin-state-{name}.webp','cx':120,'cy':round(350/3,3),'topR':round(220*.78/3,3),'bottomR':round(220*.86/3,3),'sourceRadius':round(r,2),'scale':round(scale,4)}

def receipt(name,im):
    im=trim(im)
    im.save(ASSETS/f'kvitya-state-{name}.webp',lossless=True)
    # The top paper band identifies the body without raised hands.
    band=im.getchannel('A').crop((0,0,im.width,round(im.height*.13))).point(lambda a:255 if a>16 else 0).getbbox()
    l,_,r,_=band;w=r-l
    face=im.crop((round(l+w*.13),round(im.height*.14),round(r-w*.13),round(im.height*.40)))
    face.save(ASSETS/f'kvitya-state-{name}-face.webp',lossless=True)
    return {'file':f'kvitya-state-{name}.webp','face':f'kvitya-state-{name}-face.webp'}

meta={'coins':{},'receipts':{},'strips':[]}
meta['coins']['welcome']=coin('welcome',Image.open(ASSETS/'coin-a.webp').convert('RGBA'))
meta['receipts']['default']=receipt('default',Image.open(ASSETS/'kvitya-a.webp').convert('RGBA'))
jobs=[('coin-expressions-1',['wink','surprised','think'],'coin'),('coin-expressions-2',['joy','worried','victory'],'coin'),('kvitya-expressions',['joy','think'],'receipt')]
for source,names,kind in jobs:
    file=ASSETS/f'{source}.png'
    if not file.exists():continue
    im=Image.open(file).convert('RGBA')
    groups=components.component_frame_groups(im,len(names))
    if groups is None:raise ValueError(f'{source}: expected {len(names)} separated connected poses')
    for name,group in zip(names,groups):
        pose=components.component_group_image(im,group)
        meta['coins' if kind=='coin' else 'receipts'][name]=(coin if kind=='coin' else receipt)(name,pose)
    meta['strips'].append({'source':source,'names':names,'groups':len(groups)})
(ROOT/'emotion-geometry.js').write_text('window.MASCOT_STATES = '+json.dumps(meta)+';\n')
(ROOT/'emotion-processing.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({'coins':list(meta['coins']),'receipts':list(meta['receipts']),'strips':meta['strips']}))
