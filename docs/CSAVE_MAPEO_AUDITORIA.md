# Auditoría Mapeo CSAVE — Fase 0

Fecha: 2026-08-31 — Walker `scripts/walk_csave.js` sobre `OdinReader.parse()` (AST).

Saves auditados (tamaños reales):

| Save | Tamaño | Root children | Nota |
|---|---|---|---|
| `Downloads/MOD_save (5).csave` | 854081 | 101 | farm completa, 1301 no en raíz (está en sublocations[6] furniture) |
| `TsukiSaves/save2.csave` | 574189 | 101 | mediano |
| `TsukiSaves/save (14).csave` | 207246 | 101 | chico |
| `Downloads/saveAndroid1.csave` | 148161 | 101 | mínimo |

## Walker raíz — Claves primer nivel (typeName + marker)

Todos los saves comparten las mismas 101 claves (sample MOD_save (5)):

```
PlayerStrings Dict 0x1, activity FurnitureBoundActivitySave 0x1, apartmentSaves 0x2d (null) o Dict, bagTransmog 0x17, bountiesClaimed 0x17, bypassBackup 0x2b, camBounties 0x17, carrots 0x17, carrotsBought/Earned/Given/Spent 0x17, cloudDisabled 0x2b, cloversBred 0x17, collection HashSet 0x1, conditionSaves List 0x1, conserveBattery 0x2b, dailyItemTracker List 0x1, deliverySave 0x2d, diarySaves List, encountersActive 0x2d, endBedtime 0x1f, eventSaves List, farmNotifSettings 0x1d, fingerOffset 0x1f, firstSaved 0x21, ..., sublocations Dict, tempTimers List, trainSave, trip 0x2d, tutorials 0x1d, uniqueFurnitureBought List, unluckiness 0x1f, upgradedSublocationSaves 0x2b
```

Ver `walk_out.txt` completo (101 filas) — idéntico en los 4 saves (solo cambian valores y null vs List).

## Diff vs CSAVE_MAPEO_100.md

| Campo | Tag previo | Walker confirma | Estado auditoría |
|---|---|---|---|
| location | FALTA | existe 0x1d (int enum) | **FALTA** — offset en nodo location (value 0..6) hex 1d |
| tutorials | FALTA | 0x1d enum | FALTA |
| gameStartOA | PARCIAL | 0x21 double valor ≈ 44927 | PARCIAL (extraVars, no UI) |
| sublocations extraFurnitureSaves | FALTA | **NO aparece** como clave raíz; walker no encontró `extraFurnitureSaves` — puede ser subcampo de SublocationSave (no listado en raíz). Requiere walker de sublocations. | **FALTA** confirmar |
| punchcard | PARCIAL | 0x1 Punchcard children=5 | PARCIAL |
| phoneSave | PARCIAL | 0x1 children=13 | PARCIAL |
| spEventSaves ranCutscene/letterTriggered | PARCIAL | List size 1, falta walk de hijos | PARCIAL — verificar en Fase1 walker hijos |
| potGuyStorage | FALTA | `potGuyStorage` **no aparece** como clave raíz en ningún save (ver listado: sí aparece `potGuyStorage 0x2d` null) — existe pero null (0x2d) en todos los saves auditados | FALTA (null 0x2d) |
| PlayerStrings | FALTA | `PlayerStrings Dict` 0x1 children=2 existe (vacío) | FALTA UI |
| collection | PARCIAL | HashSet 0x1 | PARCIAL |
| apartmentSaves | FALTA | `apartmentSaves 0x2d null` en grande, `Dict 0x1` en chico (save 14) | FALTA/PARCIAL según save |
| savedValues | FALTA | Dict 0x1 children=2 existe | FALTA UI |
| sickleOA | PARCIAL | 0x21 double | PARCIAL |
| ravenChapter/lastChapterComplete | FALTA → en walker 0x17 int existe | **OK vía generalVars** tras revisar walker (ambos 0x17) — actualizar tag |
| etc. | — | — | Walker confirma 101 claves idénticas; diferencias solo null vs List |

## Subclases FurnitureSave (walker hijos — muestreo)

Walker actual solo lista raíz; para Fase1 se requiere walker de `sublocations[].furniture[].typeName`:

- `FurnitureSave` base (reference id, orientation, position)
- `CropSave` (harvestTimeOA, placedOA, ripe) — vista en `parser.js`
- `CropBoxSave` / `CropBox+CropBoxSave` (typeName `CropBoxSave`): slots `List<CropSlot> {cropID,quantity}`, `carrots` int caja, `startHarvestTimeOA/endHarvestTimeOA` double (0x21), `LastHarvest` (0x2D null o double) — **ancla 1301**: `findChild id==1301` no en raíz; está en `sublocations[6].furniture` (farm). Verificación manual pendiente walker anidado.
- `LampSave` / `LampToggle` enum 0x17 — no listado en raíz; es campo dentro de `FurnitureSave` de lámparas (id 27 etc.) — **FALTA** parser.

## Ancla 1301 Crop Box

- Walker raíz no encuentra `id==1301` en raíz (solo 1 hit en FurnitureRef no concluyente).
- `save2.csave` y `MOD_save (5).csave` deberían contener 1301 en sloc 6; walker anidado pendiente. Especificación `sloc 6, slots cropID 230 qty 6, carrots caja 480, LastHarvest null 0x2D`.

Siguiente: walker anidado de sublocations/furniture para confirmar slots/carrots/LastHarvest y eventIDs 0..N.
