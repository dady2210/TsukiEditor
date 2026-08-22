import UnityPy
import json
import re
import difflib
from pathlib import Path

UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.0f1'
bundle_path = r'C:\Users\Andres\Desktop\Tsuki_Odyssey\TSUKI MOVIL\icons_assets_all_2db54501230506b89397a9d0effaedcd.bundle'
catalog_path = r'C:\Users\Andres\Desktop\Tsuki_Odyssey\Tsuky_WebEditor\data\id_catalog.json'
out_dir = Path(r'C:\Users\Andres\Desktop\Tsuki_Odyssey\Tsuky_WebEditor\images\items')
out_dir.mkdir(parents=True, exist_ok=True)

print("Cargando bundle...")
env = UnityPy.Environment()
env.load_file(bundle_path)

print("Cargando catalogo...")
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Collect all sprites
sprites_dict = {}
for obj in env.objects:
    if obj.type.name == 'Sprite':
        try:
            sp = obj.read()
            sprites_dict[sp.m_Name.lower()] = sp
        except: pass

sprite_names = list(sprites_dict.keys())
print(f"Total sprites en iconos: {len(sprite_names)}")

count = 0
for entry in catalog.get('entries', []):
    item = entry.get('item')
    if not item: continue
    
    tid = entry['id']
    name_str = item.get('name', '')
    
    if '/' in name_str:
        eng = name_str.split('/')[-1].strip()
    else:
        eng = name_str.strip()
        
    base_name = re.sub(r'[^a-zA-Z0-9]', '', eng).lower()
    
    matched_name = None
    if base_name in sprites_dict:
        matched_name = base_name
    else:
        matches = difflib.get_close_matches(base_name, sprite_names, n=1, cutoff=0.8)
        if matches:
            matched_name = matches[0]
        else:
            if 'gigagrow' in base_name: matched_name = 'megagrow'
            if 'lovestruckmixtape' in base_name: matched_name = 'valentinesmixtape'
            if 'primalbag' in base_name: matched_name = 'thebag'
            
    if matched_name and matched_name in sprites_dict:
        sp = sprites_dict[matched_name]
        try:
            img = sp.image.convert("RGBA")
            img.save(str(out_dir / f"ITEM_{tid}.png"))
            count += 1
        except Exception as e:
            pass

print(f"Exportados {count} iconos de ITEMS en {out_dir}")
