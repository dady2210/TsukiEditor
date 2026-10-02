/**
 * castle_core.js — Framework Core (Castle 2D) port para Tsuki's Odyssey
 * Basado en la arquitectura original del juego (uniquecorn/Castle).
 *
 * Módulos implementados:
 * 1. CastleSave & VersionNum (OADate, PlayTime, versionado)
 * 2. SimpleTime, TimeRange & SimpleDate (tiempo canónico y cruce de medianoche)
 * 3. Moon (fase lunar astronómica con ciclo sinódico y fecha juliana)
 * 4. CastleGrid (búsqueda en espiral, líneas Bresenham, perímetro de muebles)
 * 5. CastleManager (umbrales de gesto: Tap vs Drag, selección por profundidad)
 * 6. LightBounds & Tools.Intersect (recorte de luces contra paredes)
 * 7. CastleBGM (bucles de música con punto de muestra de introducción)
 * 8. Iso & Seasons (la geometría isométrica y las estaciones, una sola vez)
 */

(function(global) {
  'use strict';

  // Constante base para fechas OLE Automation (30 Dic 1899)
  const OA_EPOCH = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0)).getTime();
  const MS_PER_DAY = 86400000;

  // =========================================================================
  // 1. CASTLE SAVE & VERSION NUM
  // =========================================================================
  const CastleSave = {
    /**
     * Convierte un Date de JS a OLE Automation Date (número double de días)
     */
    toOADate(date) {
      if (!date) return 0;
      const d = (date instanceof Date) ? date : new Date(date);
      return (d.getTime() - OA_EPOCH) / MS_PER_DAY;
    },

    /**
     * Convierte un OLE Automation Date a Date de JS
     */
    fromOADate(oaDate) {
      if (typeof oaDate !== 'number' || isNaN(oaDate) || oaDate <= 0) return new Date();
      return new Date(OA_EPOCH + Math.round(oaDate * MS_PER_DAY));
    },

    /**
     * Calcula el tiempo total de juego a partir de firstSaved y lastSaved (ambos OADate)
     */
    calcPlayTime(firstSavedOA, lastSavedOA) {
      if (!firstSavedOA || !lastSavedOA || lastSavedOA <= firstSavedOA) {
        return { totalMs: 1000, hours: 0, minutes: 0, seconds: 1, formatted: '0h 0m' };
      }
      const diffDays = lastSavedOA - firstSavedOA;
      const totalMs = Math.max(1000, Math.round(diffDays * MS_PER_DAY));
      const totalSeconds = Math.floor(totalMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return {
        totalMs,
        hours,
        minutes,
        seconds,
        formatted: `${hours}h ${minutes}m`
      };
    },

    /**
     * Codifica número de versión como en Tools.VersionNum
     * (Major * 10000) + (Minor * 100) + Patch
     */
    encodeVersion(major, minor, patch = 0) {
      return (parseInt(major, 10) * 10000) + (parseInt(minor, 10) * 100) + parseInt(patch, 10);
    },

    /**
     * Decodifica un número de versión a objeto y string
     */
    decodeVersion(versionNum) {
      const v = parseInt(versionNum, 10) || 0;
      const major = Math.floor(v / 10000);
      const minor = Math.floor((v % 10000) / 100);
      const patch = v % 100;
      return {
        major,
        minor,
        patch,
        string: `${major}.${minor}.${patch}`
      };
    }
  };

  // =========================================================================
  // 2. SIMPLE TIME, TIME RANGE & SIMPLE DATE
  // =========================================================================
  class SimpleTime {
    constructor(minutesOrHour, minute = 0) {
      if (minute !== 0 || arguments.length >= 2) {
        this.minutes = (Math.max(0, Math.min(23, parseInt(minutesOrHour, 10) || 0)) * 60) +
                       Math.max(0, Math.min(59, parseInt(minute, 10) || 0));
      } else if (minutesOrHour instanceof Date) {
        this.minutes = (minutesOrHour.getHours() * 60) + minutesOrHour.getMinutes();
      } else {
        const m = parseInt(minutesOrHour, 10) || 0;
        this.minutes = ((m % 1440) + 1440) % 1440;
      }
    }

    get hour() { return Math.floor(this.minutes / 60); }
    set hour(h) {
      this.minutes = (Math.max(0, Math.min(23, parseInt(h, 10) || 0)) * 60) + this.minute;
    }

    get minute() { return this.minutes % 60; }
    set minute(m) {
      this.minutes = (this.hour * 60) + Math.max(0, Math.min(59, parseInt(m, 10) || 0));
    }

    compareTo(other) {
      const om = (other instanceof SimpleTime) ? other.minutes : (parseInt(other, 10) || 0);
      return this.minutes - om;
    }

    equals(other) {
      return this.compareTo(other) === 0;
    }

    toString() {
      const h = this.hour;
      const m = String(this.minute).padStart(2, '0');
      if (this.minutes < 60 || this.minutes === 1440) {
        return `12:${m}AM`;
      } else if (this.minutes >= 720 && this.minutes < 780) {
        return `12:${m}PM`;
      } else if (this.minutes < 720) {
        return `${String(h).padStart(2, '0')}:${m}AM`;
      } else {
        return `${String(h - 12).padStart(2, '0')}:${m}PM`;
      }
    }

    to24HString() {
      return `${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}`;
    }

    static fromDate(d) {
      return new SimpleTime(d);
    }
  }

  class TimeRange {
    constructor(from, to) {
      this.from = (from instanceof SimpleTime) ? from : new SimpleTime(from);
      this.to = (to instanceof SimpleTime) ? to : new SimpleTime(to);
    }

    get reverseRange() {
      return this.to.minutes < this.from.minutes;
    }

    get label() {
      return `${this.from.toString()} - ${this.to.toString()}`;
    }

    /**
     * Verifica si una hora (Date, SimpleTime o minutos) está dentro del rango.
     * Maneja correctamente los rangos normales y los que cruzan medianoche (ej: 22:00 a 06:00).
     */
    check(timeOrMinutes) {
      let m;
      if (timeOrMinutes instanceof SimpleTime) m = timeOrMinutes.minutes;
      else if (timeOrMinutes instanceof Date) m = (timeOrMinutes.getHours() * 60) + timeOrMinutes.getMinutes();
      else m = ((parseInt(timeOrMinutes, 10) % 1440) + 1440) % 1440;

      const f = this.from.minutes;
      const t = this.to.minutes;

      if (f < t) {
        return m >= f && m < t;
      }
      if (f === t) {
        return m === f;
      }
      // reverseRange: ej: 22:00 (1320) a 06:00 (360)
      return m < t || m >= f;
    }

    static inRange(timeOrMinutes, from, to) {
      return new TimeRange(from, to).check(timeOrMinutes);
    }
  }

  const TOTAL_DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  class SimpleDate {
    constructor(daysOrMonth, day = null) {
      if (day !== null) {
        const month = parseInt(daysOrMonth, 10) || 1;
        const d = parseInt(day, 10) || 1;
        let acc = 0;
        for (let i = 0; i < month - 1 && i < 12; i++) {
          acc += TOTAL_DAYS_IN_MONTH[i];
        }
        this.days = Math.max(1, Math.min(365, acc + d));
      } else if (daysOrMonth instanceof Date) {
        const month = daysOrMonth.getMonth() + 1;
        const d = daysOrMonth.getDate();
        let acc = 0;
        for (let i = 0; i < month - 1 && i < 12; i++) {
          acc += TOTAL_DAYS_IN_MONTH[i];
        }
        this.days = Math.max(1, Math.min(365, acc + d));
      } else {
        this.days = Math.max(1, Math.min(366, parseInt(daysOrMonth, 10) || 1));
      }
    }

    get day() {
      let acc = 0;
      for (let i = 0; i < TOTAL_DAYS_IN_MONTH.length; i++) {
        const next = acc + TOTAL_DAYS_IN_MONTH[i];
        if (this.days <= next) {
          return this.days - acc;
        }
        acc = next;
      }
      return 1;
    }

    get month() {
      let acc = 0;
      for (let i = 0; i < TOTAL_DAYS_IN_MONTH.length; i++) {
        acc += TOTAL_DAYS_IN_MONTH[i];
        if (this.days <= acc) {
          return i + 1;
        }
      }
      return 1;
    }

    toString() {
      return `${this.day}/${this.month}`;
    }
  }

  // =========================================================================
  // 3. FASE LUNAR ASTRONÓMICA (Moon.cs)
  // =========================================================================
  const Moon = {
    JulianConstant: 2415018.5,
    TotalLengthOfCycle: 29.53, // días del ciclo sinódico
    // 1920-01-21 05:25:00 UTC
    BaseNewMoon: Date.UTC(1920, 0, 21, 5, 25, 0),

    MoonPhases: [
      'NewMoon',        // 0: Luna Nueva
      'WaxingCrescent', // 1: Creciente cóncava
      'FirstQuarter',   // 2: Cuarto creciente
      'WaxingGibbous',  // 3: Creciente convexa
      'FullMoon',       // 4: Luna Llena
      'WaningGibbous',  // 5: Menguante convexa
      'ThirdQuarter',   // 6: Cuarto menguante
      'WaningCrescent'  // 7: Menguante cóncava
    ],

    MoonPhaseNamesEs: [
      'Luna Nueva',
      'Creciente Cóncava',
      'Cuarto Creciente',
      'Creciente Gibosa',
      'Luna Llena',
      'Menguante Gibosa',
      'Cuarto Menguante',
      'Menguante Cóncava'
    ],

    /**
     * Calcula la fase lunar para una fecha dada (o ahora en UTC)
     */
    getPhase(date = new Date()) {
      const utcMillis = (date instanceof Date) ? date.getTime() : new Date(date).getTime();
      const period = this.TotalLengthOfCycle / 8;
      const julianDate = CastleSave.toOADate(new Date(utcMillis)) + this.JulianConstant;
      const daysSinceLastNewMoon = CastleSave.toOADate(new Date(this.BaseNewMoon)) + this.JulianConstant;
      const newMoons = (julianDate - daysSinceLastNewMoon) / this.TotalLengthOfCycle;
      const intoCycle = (newMoons - Math.floor(newMoons)) * this.TotalLengthOfCycle;

      let phaseIndex = 0;
      for (let i = 0; i < 8; i++) {
        if (intoCycle < i * period) continue;
        if (intoCycle > period * (i + 1)) continue;
        phaseIndex = i;
      }

      return {
        phase: phaseIndex,
        id: this.MoonPhases[phaseIndex],
        nameEs: this.MoonPhaseNamesEs[phaseIndex],
        intoCycle,
        cyclePercent: (intoCycle / this.TotalLengthOfCycle)
      };
    },

    getPhaseName(date = new Date()) {
      return this.getPhase(date).nameEs;
    },

    /**
     * Devuelve el multiplicador de luz nocturna según la fase lunar
     * FullMoon es la más brillante (1.0), NewMoon la más oscura (0.2)
     */
    getNightLightMultiplier(phaseOrDate) {
      let idx;
      if (typeof phaseOrDate === 'number') idx = phaseOrDate;
      else if (phaseOrDate && typeof phaseOrDate.phase === 'number') idx = phaseOrDate.phase;
      else idx = this.getPhase(phaseOrDate instanceof Date ? phaseOrDate : new Date()).phase;
      const multipliers = [0.20, 0.40, 0.65, 0.85, 1.00, 0.85, 0.65, 0.40];
      return multipliers[idx % 8] != null ? multipliers[idx % 8] : 0.50;
    }
  };

  // =========================================================================
  // 4. SISTEMA DE GRILLA ISOMÉTRICA (CastleGrid.cs)
  // =========================================================================
  class CastleGrid {
    constructor(x, y) {
      this.x = Math.round(x) || 0;
      this.y = Math.round(y) || 0;
    }

    shift(dx, dy) {
      return new CastleGrid(this.x + dx, this.y + dy);
    }

    subtract(dx, dy) {
      return new CastleGrid(this.x - dx, this.y - dy);
    }

    distance(other) {
      return Math.abs(other.x - this.x) + Math.abs(other.y - this.y);
    }

    sqrDistance(other) {
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      return (dx * dx) + (dy * dy);
    }

    /**
     * Generador en espiral para búsqueda de celdas libres más cercanas
     * idéntico a CastleGrid.Spiral(n)
     */
    spiral(n) {
      let r = 0, x = 0, y = 0;
      for (let i = 0; i < n; i++) {
        switch (r % 4) {
          case 0:
            x++;
            if (x > Math.floor(r / 4)) r++;
            break;
          case 1:
            y++;
            if (y > Math.floor(r / 4)) r++;
            break;
          case 2:
            x--;
            if (x < -Math.floor(r / 4)) r++;
            break;
          case 3:
            y--;
            if (y < -Math.floor(r / 4)) r++;
            break;
        }
      }
      return new CastleGrid(this.x + x, this.y + y);
    }

    /**
     * Traza una línea recta sobre la grilla usando Bresenham entero (CastleGrid.Line)
     */
    line(end) {
      const points = [];
      let x = this.x;
      let y = this.y;
      if (x === end.x && y === end.y) {
        points.push(new CastleGrid(x, y));
        return points;
      }

      let dx = Math.abs(end.x - x);
      let dy = Math.abs(end.y - y);
      const dx2 = 2 * dx;
      const dy2 = 2 * dy;
      const ix = x < end.x ? 1 : -1;
      const iy = y < end.y ? 1 : -1;
      let d = 0;

      if (dx >= dy) {
        while (true) {
          points.push(new CastleGrid(x, y));
          if (x === end.x) break;
          x += ix;
          d += dy2;
          if (d > dx) {
            y += iy;
            d -= dx2;
          }
        }
      } else {
        while (true) {
          points.push(new CastleGrid(x, y));
          if (y === end.y) break;
          y += iy;
          d += dx2;
          if (d > dy) {
            x += ix;
            d -= dy2;
          }
        }
      }
      return points;
    }

    /**
     * Calcula el perímetro exterior de celdas que rodean a un objeto de ancho W x alto H
     * (CastleGrid.GetGridsAroundNonAlloc)
     */
    static getGridsAround(grid, width = 1, height = 1) {
      const result = [];
      const gx = grid.x;
      const gy = grid.y;

      // Fila inferior (y - 1) y fila superior (y + height)
      for (let x = 0; x < width + 2; x++) {
        const curX = (gx - 1) + x;
        result.push(new CastleGrid(curX, gy - 1));
        result.push(new CastleGrid(curX, gy + height));
      }
      // Laterales izquierdo (x - 1) y derecho (x + width)
      for (let y = 0; y < height; y++) {
        result.push(new CastleGrid(gx - 1, gy + y));
        result.push(new CastleGrid(gx + width, gy + y));
      }
      return result;
    }
  }

  // =========================================================================
  // 5. GESTOS Y SELECCIÓN (CastleManager.cs / CastleObject.cs)
  // =========================================================================
  const CastleManager = {
    // Umbrales canónicos de Castle
    MAX_TAP_TIME_SEC: 0.35,
    MAX_TAP_SQR_DIST: 25.0, // píxeles al cuadrado

    /**
     * Evalúa si un gesto califica como "QuickTap" (clic rápido sin arrastre)
     */
    isQuickTap(durationSeconds, deltaX, deltaY) {
      const sqrDist = (deltaX * deltaX) + (deltaY * deltaY);
      return durationSeconds < this.MAX_TAP_TIME_SEC && sqrDist < this.MAX_TAP_SQR_DIST;
    },

    /**
     * Verifica si un evento ocurre sobre elementos interactivos de la interfaz web
     */
    isTouchingUI(event) {
      if (!event || !event.target) return false;
      return !!event.target.closest('button, input, select, textarea, .modal, .hud-btn, .port-hud-top, .port-hud-bottom, #editor-panel, #catalog-panel, .toolbar, .layer-list, .prop-group');
    },

    /**
     * Ordena objetos interactivos por proximidad de cámara / profundidad Z
     */
    sortByDepth(objects) {
      return [...objects].sort((a, b) => {
        // En 2D isométrico: mayor Y (más abajo) y mayor sortingLayer van al frente
        const layerA = a.sl || a.sortingLayer || 0;
        const layerB = b.sl || b.sortingLayer || 0;
        if (layerA !== layerB) return layerB - layerA;
        const orderA = a.o || a.orderInLayer || 0;
        const orderB = b.o || b.orderInLayer || 0;
        if (orderA !== orderB) return orderB - orderA;
        return (b.y || 0) - (a.y || 0);
      });
    }
  };

  // =========================================================================
  // 6. RECORTE DE LUCES CONTRA LÍMITES / PAREDES (LightBounds.cs & Tools.Intersect)
  // =========================================================================
  const Tools = {
    /**
     * Intersección de dos segmentos de línea A->B y C->D (Tools.Intersect)
     */
    intersect(Ax, Ay, Bx, By, Cx, Cy, Dx, Dy) {
      const a = ((Dx - Cx) * (Cy - Ay)) - ((Dy - Cy) * (Cx - Ax));
      const b = ((Dx - Cx) * (By - Ay)) - ((Dy - Cy) * (Bx - Ax));
      const c = ((Bx - Ax) * (Cy - Ay)) - ((By - Ay) * (Cx - Ax));

      if (Math.abs(b) <= 0.0001) return null; // paralelas o colineales

      const alpha = a / b;
      const beta = c / b;
      if (alpha < 0 || alpha > 1 || beta < 0 || beta > 1) return null;

      return {
        x: Ax + (alpha * (Bx - Ax)),
        y: Ay + (alpha * (By - Ay)),
        alpha
      };
    }
  };

  const LightBounds = {
    /**
     * Comprueba si un punto (x, y) está dentro de un polígono (Ray Casting)
     */
    overlaps(px, py, polygon) {
      if (!polygon || polygon.length < 3) return false;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > py) !== (yj > py)) &&
                          (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    },

    /**
     * Recorta un rayo desde origin hasta dest contra los bordes de un polígono de habitación
     * (LightBounds.CheckLine)
     */
    checkLine(origX, origY, destX, destY, polygon) {
      if (this.overlaps(destX, destY, polygon)) {
        return { hit: false, x: destX, y: destY, alpha: 0 };
      }
      if (!polygon || polygon.length < 3) {
        return { hit: false, x: destX, y: destY, alpha: 0 };
      }

      for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        const inter = Tools.intersect(origX, origY, destX, destY, p1.x, p1.y, p2.x, p2.y);
        if (inter) {
          return { hit: true, x: inter.x, y: inter.y, alpha: inter.alpha };
        }
      }
      return { hit: false, x: destX, y: destY, alpha: 0 };
    }
  };

  // =========================================================================
  // 7. MÚSICA Y BUCLE CON INTRODUCCIÓN (CastleBGM.cs)
  // =========================================================================
  class CastleBGMPlayer {
    constructor() {
      this.audio = null;
      this.introLoop = false;
      this.introSamplePoint = 0;
      this.sampleRate = 44100;
      this.musicVolume = 1.0;
      this.masterVolume = 1.0;
      this._onTimeUpdate = this._handleTimeUpdate.bind(this);
      this._onEnded = this._handleEnded.bind(this);
    }

    get currentAudio() {
      return this.audio;
    }

    set currentAudio(audioElement) {
      this.bindAudioElement(audioElement);
    }

    bindAudioElement(audioElement) {
      if (this.audio) {
        this.audio.removeEventListener('timeupdate', this._onTimeUpdate);
        this.audio.removeEventListener('ended', this._onEnded);
      }
      this.audio = audioElement;
      if (this.audio) {
        this.audio.addEventListener('timeupdate', this._onTimeUpdate);
        this.audio.addEventListener('ended', this._onEnded);
        this.applyVolume();
      }
    }

    setMusicVolume(vol) {
      const v = parseFloat(vol);
      if (!isNaN(v)) {
        this.musicVolume = Math.max(0, Math.min(1, v));
        this.applyVolume();
      }
    }

    setMasterVolume(vol) {
      const v = parseFloat(vol);
      if (!isNaN(v)) {
        this.masterVolume = Math.max(0, Math.min(1, v));
        this.applyVolume();
      }
    }

    applyVolume() {
      if (this.audio) {
        this.audio.volume = Math.max(0, Math.min(1, this.masterVolume * this.musicVolume));
      }
    }

    setTrack(src, introLoop = false, introSamplePoint = 0, sampleRate = 44100) {
      this.introLoop = !!introLoop;
      this.introSamplePoint = parseInt(introSamplePoint, 10) || 0;
      this.sampleRate = parseInt(sampleRate, 10) || 44100;
      if (this.audio) {
        this.audio.src = src;
        this.audio.loop = !this.introLoop; // si no hay introLoop, loop nativo del navegador
      }
    }

    get loopTime() {
      if (!this.introLoop || this.introSamplePoint <= 0) return 0;
      return this.introSamplePoint / this.sampleRate;
    }

    _handleEnded() {
      if (!this.audio) return;
      if (this.introLoop) {
        this.audio.currentTime = this.loopTime;
        this.audio.play().catch(() => {});
      }
    }

    _handleTimeUpdate() {
      // Loop continuo fluido si el navegador lo permite
      if (this.introLoop && this.audio && this.audio.duration > 0) {
        if (this.audio.currentTime >= this.audio.duration - 0.05) {
          this.audio.currentTime = this.loopTime;
        }
      }
    }
  }

  const bgmInstance = new CastleBGMPlayer();
  CastleBGMPlayer.instance = bgmInstance;
  CastleBGMPlayer.setMusicVolume = (v) => bgmInstance.setMusicVolume(v);
  CastleBGMPlayer.setMasterVolume = (v) => bgmInstance.setMasterVolume(v);

  // =========================================================================
  // EXPOSICIÓN GLOBAL
  // =========================================================================
  // =========================================================================
  // 8. GEOMETRÍA ISOMÉTRICA Y ESTACIONES (la cuenta única)
  // =========================================================================
  //
  // POR QUÉ ESTÁ AQUÍ
  // -----------------
  // Estas tres cuentas estaban escritas DOS veces —en `map.js`, que pinta el port, y en
  // `map_editor_2.html`, que pinta el editor— y en esta sesión se corrigieron tres veces
  // en uno de los dos sitios dejando el otro viejo:
  //
  //   · el `oy` de los sprites, que iba con el signo cambiado en `play_scenery`
  //   · la numeración de estaciones, corregida en `play_scenery` y no en `map.js`
  //   · la fórmula de pared, corregida en `map.js` y no en el editor
  //
  // Cada vez el síntoma era el mismo y desconcertante: «en play se ve bien y en el editor
  // no», o al revés. `castle_core.js` lo cargan los dos, así que la cuenta vive aquí una
  // sola vez y no puede divergir.
  //
  // TODO SALE DEL BINARIO, no de encajar a ojo.
  const Iso = {
    /**
     * Celda de suelo -> mundo. `SimpleGrid.get_IsoPoint`:
     *
     *     isoX = 0.25 · (x − y)
     *     isoY = 0.125 · (x + y)
     *
     * A PPU 150 eso es `cw/2 = 0.25` y `ch/2 = 0.125`, que es lo que da el tamaño de
     * celda de la superficie.
     */
    floorPoint(x, y, cw, ch) {
      const a = (cw === undefined ? 0.5 : cw) / 2;
      const b = (ch === undefined ? 0.25 : ch) / 2;
      return { x: (x - y) * a, y: (x + y) * b };
    },

    /**
     * Celda de pared -> mundo. `CastleTools.WallIsoPoint` (RVA 0x3116180):
     *
     *     x = 0.25 · u
     *     y = 0.25 · v + (volteada ? +0.125 : −0.125) · u
     *
     * `u` va a lo largo de la pared y `v` hacia arriba. Las DOS caras crecen en +x; lo
     * único que cambia entre ellas es el signo del término que las inclina. Restar en la
     * x en la cara volteada —que es lo que hacían las dos copias— manda la pared
     * izquierda al lado contrario.
     */
    wallPoint(u, v, flipped, cw, ch) {
      const a = (cw === undefined ? 0.5 : cw) / 2;
      const c = (ch === undefined ? 0.25 : ch);
      const signo = flipped ? 1 : -1;
      return { x: u * a, y: signo * u * (c / 2) + v * c };
    },

    /**
     * El tamanio de celda de una superficie, EN UNIDADES DE MUNDO.
     *
     * En Unity la rejilla isometrica usa siempre 0,25 x 0,125 unidades, o sea diamantes
     * de 75 x 37,5 px a PPU 150. Pero el `cell` que traen las superficies no siempre es
     * ese, y hay que normalizarlo:
     *
     *   75   x 37,5   57 suelos      ya es el nativo
     *   37,5 x 37,5   62 paredes     lo escribe `sync_surface_anchors.py`
     *   58   x 28     33 suelos      medidos sobre un fondo ya escalado a 0,75
     *   56   x 28     16 suelos      lo mismo
     *   sin cell      36 paredes
     *
     * Por eso la regla: un ancho de mas de 70 ya es nativo, y si no, 75; un alto de mas
     * de 35 ya es nativo, y si no, 37,5.
     *
     * Esto estaba SOLO en `map.js`. El editor leia el `cell` crudo, con 56 x 28 por
     * defecto, asi que en las 62 paredes de `37,5 x 37,5` usaba la MITAD del paso
     * horizontal: los muebles de pared -los posters de la Casa de Moca, por ejemplo-
     * caian en otra columna que en play. Compartirlo es lo unico que garantiza que los
     * dos coloquen igual.
     */
    cellUnits(surf) {
      const cellW = (surf && surf.cell && surf.cell.w > 70) ? surf.cell.w : 75;
      const cellH = (surf && surf.cell && surf.cell.h > 35) ? surf.cell.h : 37.5;
      return { cw_u: cellW / 150, ch_u: cellH / 150 };
    },

    /**
     * Donde cae, EN MUNDO, la celda (x, y) de una superficie.
     *
     * Junta las tres cosas que hay que acertar a la vez -el origen, el tamanio de celda
     * y la formula-, porque acertar dos de tres no sirve de nada. Estaban repetidas en
     * `map.js` y en el editor, y cada copia resolvia el origen y la celda a su manera:
     * el editor tenia una cadena `(polyConf.flipped) || (sConf.flipped) || p.flipped`
     * que con `false` sigue buscando, asi que el signo de la inclinacion podia salir del
     * mueble en vez de la pared. Medido: 0,75 unidades de desvio vertical, unos 84 px.
     *
     * El volteo sale de la PROPIA superficie (`surf.flipped`): es una propiedad de la
     * pared, no del mueble que se cuelga en ella.
     *
     * `origen` permite pasar uno ya resuelto, para quien tenga que recurrir al
     * `origin_px` y al ancla del mapa. Hoy las 204 superficies traen `origin`.
     */
    puntoEnSuperficie(surf, x, y, origen) {
      const { cw_u, ch_u } = this.cellUnits(surf);
      const org = origen || (surf && surf.origin) || { x: 0, y: 0 };
      const esPared = !!(surf && (surf.kind === 'wall' || surf.role === 'wallpaper'));
      const p = esPared
        ? this.wallPoint(x, y, !!(surf && surf.flipped), cw_u, ch_u)
        : this.floorPoint(x, y, cw_u, ch_u);
      return { x: org.x + p.x, y: org.y + p.y };
    },

    /** Inversa de `wallPoint`, para pasar de mundo a celda. */
    wallCell(dx, dy, flipped, cw, ch) {
      const a = (cw === undefined ? 0.5 : cw) / 2;
      const c = (ch === undefined ? 0.25 : ch);
      const signo = flipped ? 1 : -1;
      const u = dx / a;
      return { u: u, v: (dy - signo * u * (c / 2)) / c };
    },
  };

  /**
   * Las estaciones, como las numera el juego.
   *
   * Sale del `SeasonData` extraído (`data/weather.json`) y lo confirman los saves: mes 8
   * da estación 0. NO es 0 primavera, que es lo que había en `map.js` y hacía que el
   * césped, el color del suelo y la copa del árbol fueran siempre una estación por
   * detrás.
   */
  const Seasons = {
    ID: { VERANO: 0, OTONIO: 1, INVIERNO: 2, PRIMAVERA: 3 },
    NOMBRES: ['Verano', 'Otoño', 'Invierno', 'Primavera'],
    CLAVES: ['summer', 'autumn', 'winter', 'spring'],

    /** La estación de un mes (1-12), con los cortes del juego. */
    deMes(m) {
      if (m >= 6 && m <= 8) return 0;
      if (m >= 9 && m <= 11) return 1;
      if (m === 12 || m <= 2) return 2;
      return 3;
    },

    nombre(id) { return this.NOMBRES[id | 0] || ('S' + id); },
    clave(id) { return this.CLAVES[id | 0] || 'summer'; },
  };

  const Castle = {
    Save: CastleSave,
    CastleSave: CastleSave,
    SimpleTime,
    TimeRange,
    SimpleDate,
    Moon,
    Grid: CastleGrid,
    CastleGrid: CastleGrid,
    Manager: CastleManager,
    CastleManager: CastleManager,
    Tools,
    LightBounds,
    BGMPlayer: CastleBGMPlayer,
    CastleBGMPlayer: CastleBGMPlayer,
    BGM: bgmInstance,
    Iso,
    Seasons
  };

  global.Castle = Castle;

})(typeof window !== 'undefined' ? window : global);
