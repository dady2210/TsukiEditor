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

  async function loadCurve() {
    if (curve) return curve;
    try {
      const r = await fetch('data/day_night.json');
      curve = await r.json();
    } catch (e) {
      curve = {
        interior: [{ minutes: 0, rgba: [40,50,90,0.45] },{ minutes: 1440, rgba: [40,50,90,0.45] }],
        exterior: [{ minutes: 0, rgba: [30,40,80,0.55] },{ minutes: 1440, rgba: [30,40,80,0.55] }]
      };
    }
    return curve;
  }

  function getRgba(minutes, exterior) {
    const c = curve ? (exterior ? curve.exterior : curve.interior) : null;
    if (!c) return [0,0,0,0];
    let m = ((minutes % 1440) + 1440) % 1440;
    for (let i = 0; i < c.length - 1; i++) {
      const a = c[i], b = c[i+1];
      if (m >= a.minutes && m <= b.minutes) {
        const t = (b.minutes === a.minutes) ? 0 : (m - a.minutes) / (b.minutes - a.minutes);
        return lerpRgba(a.rgba, b.rgba, t);
      }
    }
    return c[c.length-1].rgba;
  }

  function ensureVeil() {
    if (veilEl) return veilEl;
    const container = document.querySelector('.canvas-container');
    if (!container) return null;
    veilEl = document.getElementById('play-veil');
    if (!veilEl) {
      veilEl = document.createElement('div');
      veilEl.id = 'play-veil';
      veilEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;transition:background 400ms ease;z-index:5;display:none;';
      container.appendChild(veilEl);
    }
    haloCanvas = document.getElementById('lamp-halo-canvas');
    if (!haloCanvas) {
      haloCanvas = document.createElement('canvas');
      haloCanvas.id = 'lamp-halo-canvas';
      haloCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;display:none;';
      container.appendChild(haloCanvas);
      haloCtx = haloCanvas.getContext('2d');
    } else {
      haloCtx = haloCanvas.getContext('2d');
    }
    // HUD debe quedar por encima (port-hud-top z-index > veil)
    return veilEl;
  }

  function resizeHaloCanvas() {
    if (!haloCanvas) return;
    const rect = haloCanvas.parentElement.getBoundingClientRect();
    if (haloCanvas.width !== rect.width || haloCanvas.height !== rect.height) {
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
      // auto
      return minutes >= AUTO_ON || minutes < AUTO_OFF;
    },

    getVeilRgba(minutes, exterior) {
      return getRgba(minutes, exterior);
    },

    apply(clock, mapId) {
      ensureVeil();
      if (!veilEl) return;
      const isPlay = document.body.classList.contains('play-mode');
      if (!isPlay) { veilEl.style.display = 'none'; if (haloCanvas) haloCanvas.style.display = 'none'; return; }
      const exterior = this.isExterior(mapId);
      const minutes = (clock.hour | 0) * 60 + (clock.minute | 0);
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
      const minutes = (clock.hour | 0) * 60 + (clock.minute | 0);
      const placements = app.parser.placements || [];
      const behaviors = window.BEHAVIORS || null;
      if (!behaviors) { haloCtx.clearRect(0,0,haloCanvas.width,haloCanvas.height); haloCanvas.style.display = 'none'; return; }
      resizeHaloCanvas();
      haloCtx.clearRect(0,0,haloCanvas.width,haloCanvas.height);
      let any = false;
      const locId = mapId != null ? String(mapId) : String(app.parser.currentSLocation || '0');
      // solo sloc 0 interior por P2
      placements.forEach(p => {
        const beh = behaviors[String(p.item_id)];
        if (!beh || beh.interact !== 'light_toggle') return;
        const mode = p._lightMode || 'auto';
        if (!this.lampOn(mode, minutes)) return;
        // posición iso del placement
        const floorNum = p.groupNum != null ? p.groupNum : 0;
        let sx, sy;
        try {
          const pt = app.map.getIsoCoords(p.x, p.y, floorNum);
          sx = pt.x; sy = pt.y;
        } catch(e) { return; }
        const rad = (beh.light && beh.light.radius) || 72;
        const color = (beh.light && beh.light.color) || '#ffcc88';
        // halo radial additive
        const g = haloCtx.createRadialGradient(sx, sy - rad * 0.3, 0, sx, sy - rad * 0.3, rad);
        // parse hex to rgba
        const hex = color.replace('#','');
        const r = parseInt(hex.slice(0,2),16), gg = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
        g.addColorStop(0, `rgba(${r},${gg},${b},0.55)`);
        g.addColorStop(0.5, `rgba(${r},${gg},${b},0.22)`);
        g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
        haloCtx.fillStyle = g;
        haloCtx.globalCompositeOperation = 'lighter';
        haloCtx.beginPath();
        haloCtx.arc(sx, sy - rad * 0.3, rad, 0, Math.PI*2);
        haloCtx.fill();
        any = true;
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
