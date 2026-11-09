"""Export approved A artwork without captions; no drawing or generative edits."""
from pathlib import Path
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / 'design-lab/mascots/monetka-kvitya-soft-round/assets'
MASTER = ROOT / 'design/system/illustrations/soft-volume/guides'
OUT = ROOT / 'design/system/assets/Guides'
MASTER.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
manifest_path = ROOT / 'design/asset-exports.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
for kind, poses in [('coin', ['welcome','wink','surprised','think','joy','worried','victory']), ('kvitya', ['default','joy','think'])]:
    for pose in poses:
        variants = ['', '-avatar'] if kind == 'coin' else ['']
        for suffix in variants:
            source = LAB / f'{kind}-state-{pose}{suffix}.webp'
            shutil.copyfile(source, MASTER / source.name)
            im = Image.open(source).convert('RGBA')
            if not suffix:
                im.thumbnail((360,420), Image.Resampling.LANCZOS)
            stem = f'{kind}-{pose}{suffix}'
            for ext in ['png','webp']:
                im.save(OUT / f'{stem}.{ext}', **({'lossless':True} if ext == 'webp' else {}))
                entry = {'source':f'system/assets/Guides/{stem}.{ext}', 'target':f'frontend-react/src/assets/guides/{stem}.{ext}'}
                if entry not in manifest['exports']: manifest['exports'].append(entry)
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print('Exported 7 coin poses, face avatars and 3 Kvitya poses without captions.')
