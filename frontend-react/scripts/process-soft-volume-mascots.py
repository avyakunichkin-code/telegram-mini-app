"""Encode approved soft-volume masters from design/; export with design-assets.mjs."""
from pathlib import Path
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
SYSTEM = REPO/'design/system'
MASTERS = SYSTEM/'illustrations/soft-volume'
PERSONAS = ('student','professional','manager','entrepreneur')

def encode(image, directory, name, height):
    directory.mkdir(parents=True,exist_ok=True)
    width = max(1,round(image.width*height/image.height))
    image = image.resize((width,height),Image.Resampling.LANCZOS)
    image.save(directory/f'{name}.png',optimize=True)
    image.save(directory/f'{name}.webp',lossless=True,method=6)

for slug in PERSONAS:
    person = Image.open(MASTERS/f'{slug}-person.webp').convert('RGBA')
    target = SYSTEM/'assets/Personas'
    encode(person,target,f'{slug}-mascot',960)
    encode(person,target,f'{slug}-mascot-landing',400)
    for size,height in {'pick':56,'md':72,'dash':108}.items():
        encode(person,target,f'{slug}-mascot-{size}',height*2)
    avatar = Image.open(MASTERS/f'{slug}-avatar.webp').convert('RGBA')
    encode(avatar,target,f'{slug}-mascot-avatar',80)
    mate = Image.open(MASTERS/f'{slug}-mate.webp').convert('RGBA')
    encode(mate,SYSTEM/'assets/Companions',f'{slug}-soft-volume',216)
    print(f'OK {slug}: approved B, transparent PNG/WebP, 2x UI renditions')
