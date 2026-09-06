// scripts/build_light_profiles.js
// Genera data/light_profiles.js a partir de data/prefab_exports/*/metadata.json

const fs = require('fs');
const path = require('path');

function buildProfiles() {
  const baseDir = path.join(__dirname, '..', 'data', 'prefab_exports');
  if (!fs.existsSync(baseDir)) {
    console.error(`Directory not found: ${baseDir}`);
    return {};
  }

  const profiles = {};
  const dirs = fs.readdirSync(baseDir);

  for (const d of dirs) {
    const metaPath = path.join(baseDir, d, 'metadata.json');
    if (!fs.existsSync(metaPath)) continue;

    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (e) {
      console.error(`Error parsing ${metaPath}:`, e.message);
      continue;
    }

    const id = String(meta.id || d);

    let rootX = 0, rootY = 0;
    if (meta.nodes && meta.nodes.length > 0) {
      const root = meta.nodes[0];
      if (root && root.world_pos) {
        rootX = root.world_pos.x || 0;
        rootY = root.world_pos.y || 0;
      }
    }

    let onSprite = null;
    let offSprite = null;
    let bodySprite = null;
    const halos = [];
    const kinds = new Set();

    for (const node of meta.nodes || []) {
      const components = node.components || [];

      // Check LightSpriteObject
      for (const comp of components) {
        if (comp.type === 'LightSpriteObject' && comp.properties) {
          kinds.add('swap_sprite');
          if (comp.properties.on) {
            onSprite = String(comp.properties.on).replace(/^Sprite:\s*/, '').trim();
          }
          if (comp.properties.off) {
            offSprite = String(comp.properties.off).replace(/^Sprite:\s*/, '').trim();
          }
        }
      }

      // Check radial / LightObject / SpriteRenderer
      for (const comp of components) {
        if (comp.type === 'SpriteRenderer') {
          const spriteName = comp.sprite || '';
          const materials = comp.materials || [];
          const hasRadialMat = materials.some(m => String(m).includes('Radial'));
          const isWhite = spriteName.toLowerCase() === 'white';
          const hasLightObj = components.some(c => c.type === 'LightObject');

          if (hasRadialMat || isWhite || hasLightObj) {
            kinds.add('radial_children');
            const c = comp.color || { r: 1, g: 1, b: 1, a: 1 };
            const r = Math.round((c.r ?? 1) * 255);
            const g = Math.round((c.g ?? 1) * 255);
            const b = Math.round((c.b ?? 1) * 255);
            const a = Math.round((c.a ?? 1) * 1000) / 1000;

            const scaleX = (node.scale && node.scale.x != null) ? node.scale.x : 1;
            const scaleY = (node.scale && node.scale.y != null) ? node.scale.y : 1;
            const haloScale = scaleX || scaleY || 1;

            const localPos = node.local_pos ? {
              x: Math.round((node.local_pos.x || 0) * 10000) / 10000,
              y: Math.round((node.local_pos.y || 0) * 10000) / 10000
            } : { x: 0, y: 0 };

            const worldPos = node.world_pos || { x: rootX, y: rootY, angle: 0 };
            const worldOffset = {
              x: Math.round(((worldPos.x || 0) - rootX) * 10000) / 10000,
              y: Math.round(((worldPos.y || 0) - rootY) * 10000) / 10000
            };

            halos.push({
              local_pos: localPos,
              world_offset: worldOffset,
              scale: haloScale,
              color: [r, g, b, a],
              angle: Math.round((worldPos.angle || 0) * 100) / 100
            });
          } else {
            // Check body sprite: primer sprite no-white, no-radial, no-fx
            if (!bodySprite && spriteName && !spriteName.toLowerCase().includes('fx') && !spriteName.toLowerCase().includes('shadow')) {
              bodySprite = spriteName;
            }
          }
        }
      }
    }

    if (!bodySprite && (offSprite || onSprite)) {
      bodySprite = offSprite || onSprite;
    }

    // Only save if it has lighting traits (swap_sprite or radial_children or halos)
    if (kinds.size > 0 || halos.length > 0) {
      profiles[id] = {
        id: Number(id),
        name: meta.name || '',
        kind: Array.from(kinds),
        body_sprite: bodySprite,
        on_sprite: onSprite,
        off_sprite: offSprite,
        halos: halos
      };
    }
  }

  return profiles;
}

const profiles = buildProfiles();
const outPath = path.join(__dirname, '..', 'data', 'light_profiles.js');
const jsContent = `// Generated light profiles from prefab metadata\n// DO NOT EDIT DIRECTLY - Use scripts/build_light_profiles.js\n\nwindow.LIGHT_PROFILES = ${JSON.stringify(profiles, null, 2)};\n`;

fs.writeFileSync(outPath, jsContent, 'utf8');
console.log(`Successfully generated ${Object.keys(profiles).length} light profiles in ${outPath}`);
for (const [id, prof] of Object.entries(profiles)) {
  console.log(`- ID ${id} (${prof.name}): kind=${prof.kind.join(',')} body=${prof.body_sprite} on=${prof.on_sprite} off=${prof.off_sprite} halos=${prof.halos.length}`);
}
