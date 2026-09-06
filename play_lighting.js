// play_lighting.js — P2 velo multiply + halos lámparas (auto 19:30-07:30)
// No toca parser whitelist, no muta ITEMS_DB, no rebakea tapices.
(function() {
  const AUTO_ON = 19 * 60 + 30; // 1170
  const AUTO_OFF = 7 * 60 + 30; // 450

  let curve = null;
  let veilEl = null;
  let haloCanvas = null;
  let haloCtx = null;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpRgba(a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
  }

  const EMBEDDED_CURVE = {
    interior: [
      { minutes: 0,    rgba: [18, 22, 58, 0.74] },
      { minutes: 180,  rgba: [18, 22, 58, 0.74] },
      { minutes: 240,  rgba: [25, 28, 68, 0.70] },
      { minutes: 300,  rgba: [40, 42, 85, 0.62] },
      { minutes: 345,  rgba: [75, 55, 105, 0.48] },
      { minutes: 375,  rgba: [160, 95, 85, 0.35] },
      { minutes: 405,  rgba: [255, 155, 80, 0.28] },
      { minutes: 450,  rgba: [255, 205, 140, 0.16] },
      { minutes: 510,  rgba: [255, 235, 190, 0.08] },
      { minutes: 570,  rgba: [255, 255, 255, 0.00] },
      { minutes: 720,  rgba: [255, 255, 255, 0.00] },
      { minutes: 900,  rgba: [255, 255, 255, 0.00] },
      { minutes: 990,  rgba: [255, 225, 170, 0.09] },
      { minutes: 1050, rgba: [255, 185, 110, 0.20] },
      { minutes: 1095, rgba: [255, 130, 55, 0.36] },
      { minutes: 1125, rgba: [210, 85, 75, 0.42] },
      { minutes: 1155, rgba: [115, 50, 110, 0.52] },
      { minutes: 1185, rgba: [50, 38, 90, 0.62] },
      { minutes: 1230, rgba: [28, 30, 75, 0.68] },
      { minutes: 1290, rgba: [18, 22, 58, 0.74] },
      { minutes: 1440, rgba: [18, 22, 58, 0.74] }
    ],
    exterior: [
      { minutes: 0,    rgba: [12, 16, 52, 0.82] },
      { minutes: 180,  rgba: [12, 16, 52, 0.82] },
      { minutes: 240,  rgba: [18, 22, 62, 0.78] },
      { minutes: 300,  rgba: [30, 32, 80, 0.70] },
      { minutes: 345,  rgba: [70, 50, 105, 0.55] },
      { minutes: 375,  rgba: [170, 90, 75, 0.42] },
      { minutes: 405,  rgba: [255, 140, 65, 0.34] },
      { minutes: 450,  rgba: [255, 195, 120, 0.20] },
      { minutes: 510,  rgba: [255, 230, 175, 0.10] },
      { minutes: 570,  rgba: [255, 255, 255, 0.00] },
      { minutes: 720,  rgba: [255, 255, 255, 0.00] },
      { minutes: 900,  rgba: [255, 255, 255, 0.00] },
      { minutes: 990,  rgba: [255, 215, 150, 0.12] },
      { minutes: 1050, rgba: [255, 170, 90, 0.26] },
      { minutes: 1095, rgba: [255, 110, 40, 0.44] },
      { minutes: 1125, rgba: [200, 75, 75, 0.50] },
      { minutes: 1155, rgba: [100, 42, 105, 0.60] },
      { minutes: 1185, rgba: [40, 30, 85, 0.70] },
      { minutes: 1230, rgba: [20, 22, 68, 0.76] },
      { minutes: 1290, rgba: [12, 16, 52, 0.82] },
      { minutes: 1440, rgba: [12, 16, 52, 0.82] }
    ]
  };
  async function loadCurve() {
    if (curve) return curve;
    if (location.protocol === 'file:') { curve = EMBEDDED_CURVE; return curve; }
    try {
      const r = await fetch('data/day_night.json');
      if (!r.ok) throw new Error('no ok');
      curve = await r.json();
    } catch (e) {
      curve = EMBEDDED_CURVE;
    }
    return curve;
  }

  function getRgba(minutes, exterior) {
    const c = curve ? (exterior ? curve.exterior : curve.interior) : null;
    if (!c) return [0,0,0,0];
    let m = ((minutes % 1440) + 1440) % 1440;
    let baseRgba = null;
    for (let i = 0; i < c.length - 1; i++) {
      const a = c[i], b = c[i+1];
      if (m >= a.minutes && m <= b.minutes) {
        const t = (b.minutes === a.minutes) ? 0 : (m - a.minutes) / (b.minutes - a.minutes);
        baseRgba = lerpRgba(a.rgba, b.rgba, t);
        break;
      }
    }
    if (!baseRgba) baseRgba = c[c.length-1].rgba.slice();
    else baseRgba = baseRgba.slice();

    // P3 / Castle Moon integration: modulate night darkness on exterior maps
    const isNight = (window.Castle && window.Castle.TimeRange && typeof window.Castle.TimeRange.inRange === 'function')
      ? window.Castle.TimeRange.inRange(m, AUTO_ON, AUTO_OFF)
      : (m >= AUTO_ON || m < AUTO_OFF);

    if (exterior && isNight && window.Castle && window.Castle.Moon) {
      const moonMult = window.Castle.Moon.getNightLightMultiplier();
      // On Full Moon night (moonMult ~ 1.0), veil alpha is slightly softer (brighter night)
      // On New Moon night (moonMult ~ 0.35), veil alpha is darker
      const moonFactor = 1.15 - (0.28 * moonMult);
      baseRgba[3] = Math.max(0, Math.min(1, baseRgba[3] * moonFactor));
    }
    return baseRgba;
  }

  function ensureVeil() {
    if (veilEl) {
      if (haloCanvas) {
        haloCanvas.style.zIndex = '6';
        haloCanvas.style.mixBlendMode = 'screen';
      }
      return veilEl;
    }
    const container = document.querySelector('.canvas-container');
    if (!container) return null;
    veilEl = document.getElementById('play-veil');
    if (!veilEl) {
      veilEl = document.createElement('div');
      veilEl.id = 'play-veil';
      veilEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;transition:background 400ms ease;z-index:5;display:none;';
      container.appendChild(veilEl);
    } else {
      veilEl.style.zIndex = '5';
    }
    haloCanvas = document.getElementById('lamp-halo-canvas');
    if (!haloCanvas) {
      haloCanvas = document.createElement('canvas');
      haloCanvas.id = 'lamp-halo-canvas';
      haloCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;mix-blend-mode:screen;display:none;';
      container.appendChild(haloCanvas);
      haloCtx = haloCanvas.getContext('2d');
    } else {
      haloCanvas.style.zIndex = '6';
      haloCanvas.style.mixBlendMode = 'screen';
      haloCtx = haloCanvas.getContext('2d');
    }
    // HUD debe quedar por encima (port-hud-top z-index > veil)
    return veilEl;
  }

  function resizeHaloCanvas() {
    if (!haloCanvas) return;
    const mapCanvas = document.getElementById('map-canvas');
    if (mapCanvas && mapCanvas.width > 0 && mapCanvas.height > 0) {
      if (haloCanvas.width !== mapCanvas.width || haloCanvas.height !== mapCanvas.height) {
        haloCanvas.width = mapCanvas.width;
        haloCanvas.height = mapCanvas.height;
      }
      return;
    }
    const rect = haloCanvas.parentElement ? haloCanvas.parentElement.getBoundingClientRect() : null;
    if (rect && (haloCanvas.width !== rect.width || haloCanvas.height !== rect.height)) {
      haloCanvas.width = rect.width;
      haloCanvas.height = rect.height;
    }
  }

  window.Lighting = {
    AUTO_ON, AUTO_OFF,

    async init() {
      await loadCurve();
      ensureVeil();
    },

    lampOn(mode, minutes) {
      if (mode === 'on') return true;
      if (mode === 'off') return false;
      // auto: using Castle.TimeRange (handles wrap-around midnight canonically)
      if (window.Castle && window.Castle.TimeRange && typeof window.Castle.TimeRange.inRange === 'function') {
        return window.Castle.TimeRange.inRange(minutes, AUTO_ON, AUTO_OFF);
      }
      return minutes >= AUTO_ON || minutes < AUTO_OFF;
    },

    getMoonInfo(date) {
      if (window.Castle && window.Castle.Moon) {
        return {
          phase: window.Castle.Moon.getPhase(date),
          phaseName: window.Castle.Moon.getPhaseName(date),
          multiplier: window.Castle.Moon.getNightLightMultiplier(window.Castle.Moon.getPhase(date))
        };
      }
      return null;
    },

    getVeilRgba(minutes, exterior) {
      return getRgba(minutes, exterior);
    },

    apply(clock, mapId) {
      ensureVeil();
      if (!veilEl) return;
      const isPlay = document.body.classList.contains('play-mode');
      if (!isPlay) { veilEl.style.display = 'none'; if (haloCanvas) haloCanvas.style.display = 'none'; return; }
      if (!clock) {
        clock = (window.GameTime && typeof window.GameTime.now === 'function')
          ? window.GameTime.now()
          : (window.app && window.app.parser && window.app.parser.getClock ? window.app.parser.getClock() : { hour: 0, minute: 0 });
      }
      const exterior = this.isExterior(mapId);
      const h = (clock && clock.hour != null) ? (clock.hour | 0) : 0;
      const min = (clock && clock.minute != null) ? (clock.minute | 0) : 0;
      const minutes = h * 60 + min;
      const rgba = getRgba(minutes, exterior);
      veilEl.style.background = `rgba(${Math.round(rgba[0])},${Math.round(rgba[1])},${Math.round(rgba[2])},${rgba[3]})`;
      veilEl.style.display = 'block';
      this.renderHalos(clock, mapId);
    },

    isExterior(mapId) {
      if (window.mapsAtlas) {
        const entry = window.mapsAtlas.find(s => String(s.mapId) === String(mapId));
        if (entry && entry.lighting) return entry.lighting === 'exterior';
      }
      return String(mapId) === '6';
    },

    renderHalos(clock, mapId) {
      if (!haloCanvas || !haloCtx) return;
      const app = window.app;
      if (!app || !app.map || !app.parser) return;
      const isPlay = document.body.classList.contains('play-mode');
      if (!isPlay) {
        haloCtx.clearRect(0,0,haloCanvas.width,haloCanvas.height);
        haloCanvas.style.display = 'none';
        return;
      }
      if (!clock) {
        clock = (window.GameTime && typeof window.GameTime.now === 'function')
          ? window.GameTime.now()
          : (app.parser.getClock ? app.parser.getClock() : { hour: 0, minute: 0 });
      }
      const minutes = (clock.hour | 0) * 60 + (clock.minute | 0);
      const placements = app.parser.placements || [];
      const behaviors = window.BEHAVIORS || null;
      if (!behaviors) { haloCtx.clearRect(0,0,haloCanvas.width,haloCanvas.height); haloCanvas.style.display = 'none'; return; }
      resizeHaloCanvas();
      haloCtx.clearRect(0,0,haloCanvas.width,haloCanvas.height);
      let any = false;
      const locId = mapId != null ? String(mapId) : String(app.parser.currentSLocation || '0');
      placements.forEach(p => {
        if (p.cluster != null && String(p.cluster) !== String(locId)) return;
        const profile = window.LIGHT_PROFILES && window.LIGHT_PROFILES[String(p.item_id)];
        const beh = behaviors[String(p.item_id)];
        const isLamp = profile || (beh && beh.interact === 'light_toggle') || (p._lampToggle !== undefined && p._lampToggle !== null);
        if (!isLamp) return;
        const mode = p._lightMode || 'auto';
        if (!this.lampOn(mode, minutes)) return;
        // posición iso del placement
        const floorNum = p.floor != null ? p.floor : (p.groupNum != null ? p.groupNum : 0);
        let sx, sy;
        const scale = (app.map && app.map.scale) || 1;
        try {
          if (p.isWall) {
            const bbox = app.map._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };
            const pt = app.map.getWallIsoCoords(p.x, p.y, !!p.flipped, bbox, floorNum);
            const img = app.map.getImage(p.item_id, 0, p);
            const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
            const u = _bgo * scale;
            const dh = (img && img.complete && img.naturalHeight > 0) ? img.height * u : 60 * u;
            sx = pt.x;
            sy = pt.y - dh * 0.5;
          } else {
            const pt = app.map.getIsoCoords(p.x, p.y, floorNum);
            const off = (app.map._getPlacementRenderOffset) ? app.map._getPlacementRenderOffset(p) : { x: 0, y: 0 };
            sx = pt.x + off.x;
            sy = pt.y + off.y;
          }
        } catch(e) { return; }

        if (profile && profile.halos && profile.halos.length > 0) {
          const flip = p.flipped ? -1 : 1;
          const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
          const u = _bgo * scale;
          for (const halo of profile.halos) {
            const hScale = Number(halo.scale) || 1;
            const rad = (hScale <= 1 ? Math.max(12, hScale * 65) : (hScale <= 4 ? hScale * 24 : 75 + hScale * 3.5)) * scale;
            const ox = halo.world_offset ? halo.world_offset.x : (halo.local_pos ? halo.local_pos.x : 0);
            const oy = halo.world_offset ? halo.world_offset.y : (halo.local_pos ? halo.local_pos.y : 0);
            const hx = sx + flip * (ox * 100 * u);
            const hy = sy - (oy * 100 * u);
            const c = halo.color || [255, 204, 136, 0.5];
            const r = c[0], g = c[1], b = c[2], a = c[3] != null ? c[3] : 0.5;
            const grad = haloCtx.createRadialGradient(hx, hy, 0, hx, hy, rad);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
            grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${(a * 0.42).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            haloCtx.fillStyle = grad;
            haloCtx.globalCompositeOperation = 'lighter';
            haloCtx.beginPath();
            haloCtx.arc(hx, hy, rad, 0, Math.PI * 2);
            haloCtx.fill();
          }
          any = true;
        } else {
          // Generic halo for other lamps without profile
          const rad = ((beh && beh.light && beh.light.radius) || 72) * scale;
          const color = (beh && beh.light && beh.light.color) || '#ffcc88';
          const cy = p.isWall ? sy : sy - rad * 0.3;
          const g = haloCtx.createRadialGradient(sx, cy, 0, sx, cy, rad);
          const hex = color.replace('#','');
          const r = parseInt(hex.slice(0,2),16) || 255;
          const gg = parseInt(hex.slice(2,4),16) || 204;
          const b = parseInt(hex.slice(4,6),16) || 136;
          g.addColorStop(0, `rgba(${r},${gg},${b},0.55)`);
          g.addColorStop(0.5, `rgba(${r},${gg},${b},0.22)`);
          g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
          haloCtx.fillStyle = g;
          haloCtx.globalCompositeOperation = 'lighter';
          haloCtx.beginPath();
          haloCtx.arc(sx, cy, rad, 0, Math.PI * 2);
          haloCtx.fill();
          any = true;
        }
      });
      haloCtx.globalCompositeOperation = 'source-over';
      haloCanvas.style.display = any ? 'block' : 'none';
    },

    hide() {
      if (veilEl) veilEl.style.display = 'none';
      if (haloCanvas) { haloCanvas.style.display = 'none'; if (haloCtx) haloCtx.clearRect(0,0,haloCanvas.width,haloCanvas.height); }
    }
  };

  // auto-init veil hidden until play
  document.addEventListener('DOMContentLoaded', () => { loadCurve().then(ensureVeil); });
})();
