# -*- coding: utf-8 -*-
"""
build_atlas.py — genera data/maps_unified.js (atlas runtime) desde data/maps/map_X.json.

Fuente de verdad: los archivos data/maps/map_<id>.json (uno por mapa: superficies,
visuals, colliders, logic, config + bloque meta).

Reglas (fase A: unificar sin romper funcionamiento):
- Orden de entradas y orden de claves: el del atlas actual (byte-idéntico si los
  valores coinciden).
- Campos con valores desde el map file: mapId, id, name, kind, groupNum, flipped,
  rows, cols, origin (si existe), origin_px, cell, defaultCoverId.
- Campos legacy que se arrastran del atlas actual (fase B: migrarlos a map_X.json):
  mask, exportDir, assembled, outdoor, comment, lighting, poly (presencia/valor).
- Claves nuevas en map files que no existen en el atlas: SE IGNORAN con warning
  (nunca se agrega cobertura automáticamente).
- Excepción documentada: (map 0, floor, group 4) = conflicto de identidad
  (map_0.json: Ático Homecoming 1x1 vs atlas: Exterior g4 16x16). Se arrastra el
  valor legacy (Exterior) para no cambiar el runtime. Resolver contenido aparte.
- meta y atlasConfig: bootstrap del atlas actual (fase B: leer de map_X.json#meta).
- origin ausente (p. ej. floor_4/5 outdoor): se preserva ausente.

Uso:
    python scripts/build_atlas.py --check    # verifica sin escribir
    python scripts/build_atlas.py --write    # regenera data/maps_unified.js
"""
import json
import re
import sys
import argparse
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
MAPS_DIR = WEB / "data" / "maps"
ATLAS_JS = WEB / "data" / "maps_unified.js"

# Campos cuyos valores provienen del map file (cuando existen ahí).
MAP_SOURCED = ["mapId", "id", "name", "kind", "groupNum", "flipped",
               "rows", "cols", "origin", "origin_px", "cell", "defaultCoverId"]
# Excepciones: (mapId, kind, group, flipped) -> arrastre legacy verbatim.
LEGACY_PINNED = {("0", "floor", "4", "False")}


def load_current():
    raw = ATLAS_JS.read_text(encoding="utf-8")
    m = re.search(r"window\.MAPS_UNIFIED\s*=\s*(\{.*\})\s*;", raw, re.S)
    if not m:
        raise SystemExit("no se pudo parsear window.MAPS_UNIFIED")
    return raw, json.loads(m.group(1))


def load_map(mid):
    fp = MAPS_DIR / ("map_%s.json" % mid)
    if not fp.exists():
        return None
    with open(fp, encoding="utf-8") as f:
        return json.load(f)


def surf_key(kind, group, flipped):
    return (str(kind), str(group), str(bool(flipped)))


def build(warns):
    raw, uni = load_current()
    atlas = uni["atlas"]
    bymap = {}
    for mid in sorted({str(e.get("mapId")) for e in atlas}, key=int):
        m = load_map(mid)
        if m is None:
            warns.append("map_%s.json inexistente: passthrough legacy" % mid)
        bymap[mid] = m
    out_entries = []
    for e in atlas:
        mid = str(e.get("mapId"))
        key = (mid, e.get("kind"), str(e.get("groupNum")), str(bool(e.get("flipped", False))))
        m = bymap.get(mid)
        surfs = (m.get("surfaces", []) if m else [])
        # simplificación robusta: match por (kind, group, flipped)
        s = next((x for x in surfs if surf_key(x.get("kind"), x.get("groupNum"),
                                              x.get("flipped", False)) ==
                  (key[1], key[2], key[3])), None)
        if s is None or key in LEGACY_PINNED or m is None:
            if key in LEGACY_PINNED:
                warns.append("pin legacy %s (conflicto identidad, ver reporte)" % (key,))
            elif m is not None:
                warns.append("sin superficie en map_%s para %s: passthrough" % (mid, key[1:]))
            out_entries.append(e)
            continue
        ne = {}
        for k in e.keys():  # orden del atlas actual
            if k == "mapId":
                v = int(mid)
                if v != e[k]:
                    warns.append("mapId difiere en %s" % (key,))
                ne[k] = v
            elif k in MAP_SOURCED:
                if k in s:
                    ne[k] = s[k]
                else:
                    warns.append("%s sin campo %s en map_%s: legacy" % (key, k, mid))
                    ne[k] = e[k]
            else:
                ne[k] = e[k]  # legacy (mask/exportDir/assembled/outdoor/comment/lighting/poly)
        out_entries.append(ne)
    obj = {"atlas": out_entries, "meta": uni.get("meta", {}),
           "atlasConfig": uni.get("atlasConfig", {})}
    text = "window.MAPS_UNIFIED = " + json.dumps(obj, indent=2, ensure_ascii=False) + ";\n"
    return raw, text, warns


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    warns = []
    raw, text, warns = build(warns)
    print("entradas atlas: %d" % len(json.loads(
        re.search(r"window\.MAPS_UNIFIED\s*=\s*(\{.*\})\s*;", raw, re.S).group(1))["atlas"]))
    for w in warns:
        print("WARN:", w)
    if text == raw:
        print("RESULT: byte-idéntico al atlas actual")
    else:
        import difflib
        diff = list(difflib.unified_diff(raw.splitlines(), text.splitlines(), lineterm=""))
        print("RESULT: DIFIERE (%d líneas de diff)" % len(diff))
        for line in diff[:60]:
            print(line)
    if args.write:
        if text == raw:
            ATLAS_JS.write_text(text, encoding="utf-8")
            print("escrito data/maps_unified.js (idéntico)")
        else:
            print("NO escrito: hay diferencias (revisar arriba). Usar --write igualmente lo escribe.")
            ATLAS_JS.write_text(text, encoding="utf-8")
            print("escrito IGUAL (con diferencias) por --write explícito")


if __name__ == "__main__":
    main()
