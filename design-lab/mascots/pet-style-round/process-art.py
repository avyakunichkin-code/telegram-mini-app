"""Crop and encode imagegen artwork; never draw or replace illustration pixels."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets'

def trim(image):
    bounds = image.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
    if not bounds:
        raise ValueError('Empty generated artwork')
    return image.crop(bounds)

def fit(image, size):
    scale = min(size[0]/image.width,size[1]/image.height)
    return image.resize((round(image.width*scale),round(image.height*scale)),Image.Resampling.LANCZOS)

def separate_components(image, count=2):
    """Recover the two disconnected generated figures when their x ranges overlap."""
    width, height = image.size
    values = image.getchannel('A').tobytes()
    visited = bytearray(width*height)
    groups = []
    for start, value in enumerate(values):
        if value <= 16 or visited[start]:
            continue
        pending, pixels = [start], []
        visited[start] = 1
        while pending:
            pos = pending.pop(); pixels.append(pos)
            x, y = pos % width, pos // width
            neighbors = []
            if x: neighbors.append(pos-1)
            if x+1<width: neighbors.append(pos+1)
            if y: neighbors.append(pos-width)
            if y+1<height: neighbors.append(pos+width)
            for neighbor in neighbors:
                if values[neighbor]>16 and not visited[neighbor]:
                    visited[neighbor] = 1; pending.append(neighbor)
        if len(pixels)>500:
            groups.append(pixels)
    groups.sort(key=len, reverse=True)
    if len(groups)<count or (count==2 and len(groups[1])<len(groups[0])*.05):
        raise ValueError('Expected two distinct complete figure components')
    groups = sorted(groups[:count], key=lambda pixels: sum(p%width for p in pixels)/len(pixels))
    figures = []
    for pixels in groups:
        mask_bytes = bytearray(width*height)
        for pos in pixels: mask_bytes[pos] = 255
        mask = Image.frombytes('L',(width,height),bytes(mask_bytes)).filter(ImageFilter.MaxFilter(3))
        extracted = Image.new('RGBA',image.size)
        extracted.paste(image,(0,0),mask)
        figures.append(trim(extracted))
    return figures

def make_avatar(person,name):
    head_height = round(person.height*.43)
    head_band = person.getchannel('A').crop((0,0,person.width,round(person.height*.28))).getbbox()
    padding = round(person.width*.025)
    head_left, head_right = max(0,head_band[0]-padding), min(person.width,head_band[2]+padding)
    face = trim(person.crop((head_left,0,head_right,head_height)))
    face = separate_components(face,count=1)[0]
    square = Image.new('RGBA',(max(face.size),max(face.size)))
    square.alpha_composite(face,((square.width-face.width)//2,(square.height-face.height)//2))
    fit(square,(256,256)).save(ASSETS/f'{name}-avatar.webp',lossless=True)

def process(name):
    source = ASSETS/'reference'/f'{name.removesuffix("-before")}-current.png' if name.endswith('-before') else ASSETS/f'{name}-source.png'
    im = Image.open(source).convert('RGBA')
    if im.getchannel('A').getextrema()[0] == 255:
        raise ValueError(f'{name}: background is opaque; regenerate with transparency')
    im = trim(im)
    alpha = im.getchannel('A')
    occupied = [alpha.crop((x,0,x+1,im.height)).getextrema()[1] > 16 for x in range(im.width)]
    gaps, start = [], None
    for x, used in enumerate(occupied):
        if not used and start is None:
            start = x
        if used and start is not None:
            if start > im.width*.25 and x < im.width*.85:
                gaps.append((x-start, (start+x)//2))
            start = None
    if not gaps or max(gaps)[0] < 8:
        person, mate = separate_components(im)
        split = 'connected-components'
    else:
        _, split = max(gaps)
        person, mate = trim(im.crop((0,0,split,im.height))), trim(im.crop((split,0,im.width,im.height)))
    if mate.height > person.height*.8:
        raise ValueError(f'{name}: companion unexpectedly dominates person')
    person.save(ASSETS / f'{name}-person.webp', lossless=True)
    mate.save(ASSETS / f'{name}-mate.webp', lossless=True)
    # One consistent presentation scale for both variants and all four pairs.
    canvas = Image.new('RGBA', (1050,760))
    person_fit, mate_fit = fit(person,(495,680)), fit(mate,(415,350))
    canvas.alpha_composite(person_fit,(285-person_fit.width//2,730-person_fit.height))
    canvas.alpha_composite(mate_fit,(790-mate_fit.width//2,730-mate_fit.height))
    canvas.save(ASSETS / f'{name}.webp', lossless=True)
    make_avatar(person,name)
    return {'id':name,'source_size':list(Image.open(source).size),'split_x_in_trimmed':split,'person_size':list(person.size),'mate_size':list(mate.size),'presentation_size':[1050,760]}

parser = argparse.ArgumentParser()
parser.add_argument('names',nargs='*')
parser.add_argument('--avatars-only',action='store_true')
args = parser.parse_args()
names = args.names or [f'{person}-{variant}' for person in ('student','pro','boss','biz') for variant in ('a','b','before')]
if args.avatars_only:
    for name in names:
        make_avatar(Image.open(ASSETS/f'{name}-person.webp').convert('RGBA'),name)
    print(json.dumps({'avatars_updated':names}))
    raise SystemExit(0)
records = [process(name) for name in names]
report = ROOT/'art-processing.json'
previous = json.loads(report.read_text()) if report.exists() else {}
previous.update({r['id']:r for r in records})
report.write_text(json.dumps(previous,indent=2)+'\n')
print(json.dumps({'processed':names,'transparent':True,'presentation_size':[1050,760]}))
