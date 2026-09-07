// game_time.js — P3 única fuente para tiempo/flags/timers
// No agrega mapa granja, no Homecoming, no bake, no muta ITEMS_DB.
(function() {
  let parserRef = null;
  let lastSig = null;
  const listeners = { hour: [], day: [], season: [], minute: [] };
  const flagMem = new Map(); // flags no whitelist -> memoria
  const WHITELIST = new Set(['homecomingUpdates', 'currSLocData', 'carrots']);

  function emit(list, payload) { list.forEach(fn => { try { fn(payload); } catch(e) {} }); }

  window.GameTime = {
    bindParser(p) {
      parserRef = p;
      lastSig = null;
    },

    now() {
      if (!parserRef || !parserRef.getClock) {
        const d = new Date();
        return { hour: d.getHours(), minute: d.getMinutes(), day: d.getDate(), month: d.getMonth() + 1, season: 0, minutes: d.getHours() * 60 + d.getMinutes() };
      }
      const c = parserRef.getClock();
      const minute = c.minute != null ? (c.minute | 0) : new Date().getMinutes();
      return { hour: c.hour|0, minute, day: c.day|0, month: c.month|0, season: c.season|0, minutes: (c.hour|0)*60 + minute };
    },

    syncWithDevice: true, // Sincroniza con la hora real del dispositivo

    syncFromDevice(force = false) {
      if (!this.syncWithDevice && !force) return false;
      if (!parserRef || !parserRef.getClock || !parserRef.setClock) return false;
      const d = new Date(); // hora civil del sistema
      const hour = d.getHours();
      const minute = d.getMinutes();
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const cur = parserRef.getClock();
      const sig = `${hour}|${minute}|${day}|${month}`;
      if (sig === lastSig && !force) return false;
      const hourChanged = cur.hour !== hour;
      const minuteChanged = cur.minute !== minute;
      const dayChanged = cur.day !== day;
      const monthChanged = cur.month !== month;
      if (!hourChanged && !minuteChanged && !dayChanged && !monthChanged && lastSig !== null && !force) {
        lastSig = sig;
        return false;
      }
      parserRef.setClock({ hour, minute, day, month });
      lastSig = sig;
      const next = parserRef.getClock();
      const payload = {
        hour: next.hour | 0,
        minute: next.minute | 0,
        day: next.day | 0,
        month: next.month | 0,
        season: next.season | 0,
        minutes: (next.hour | 0) * 60 + (next.minute | 0)
      };
      if (minuteChanged) emit(listeners.minute, payload);
      if (hourChanged) emit(listeners.hour, payload);
      if (dayChanged) emit(listeners.day, payload);
      return true;
    },

    onMinuteChanged(cb) { listeners.minute.push(cb); },
    onHourChanged(cb) { listeners.hour.push(cb); },
    onDayChanged(cb) { listeners.day.push(cb); },
    onSeasonChanged(cb) { listeners.season.push(cb); },
    off(event, cb) {
      const key = event === 'minute' ? 'minute' : event === 'hour' ? 'hour' : event === 'day' ? 'day' : event === 'season' ? 'season' : null;
      if (!key) return;
      const arr = listeners[key];
      const i = arr.indexOf(cb);
      if (i !== -1) arr.splice(i, 1);
    },

    // ── Castle Framework Time & Moon Extensions ──────────────────────────
    moonPhase() {
      if (typeof window !== 'undefined' && window.Castle && window.Castle.Moon) {
        return window.Castle.Moon.getPhase(new Date());
      }
      return { phase: 0, id: 'NewMoon', nameEs: 'Luna Nueva' };
    },

    simpleTime() {
      const n = this.now();
      if (typeof window !== 'undefined' && window.Castle && window.Castle.SimpleTime) {
        return new window.Castle.SimpleTime(n.minutes);
      }
      return { minutes: n.minutes, hour: n.hour, minute: n.minute, toString: () => `${n.hour}:${n.minute}` };
    },

    simpleDate() {
      const n = this.now();
      if (typeof window !== 'undefined' && window.Castle && window.Castle.SimpleDate) {
        return new window.Castle.SimpleDate(n.month, n.day);
      }
      return { day: n.day, month: n.month, toString: () => `${n.day}/${n.month}` };
    },

    inTimeRange(fromMinutes, toMinutes) {
      const m = this.now().minutes;
      if (typeof window !== 'undefined' && window.Castle && window.Castle.TimeRange) {
        return new window.Castle.TimeRange(fromMinutes, toMinutes).check(m);
      }
      if (fromMinutes < toMinutes) return m >= fromMinutes && m < toMinutes;
      if (fromMinutes === toMinutes) return m === fromMinutes;
      return m < toMinutes || m >= fromMinutes;
    }
  };

  window.Flags = {
    get(name) {
      if (!parserRef) return flagMem.get(name);
      if (name === 'homecomingUpdates' && parserRef.generalVars && parserRef.generalVars.homecomingUpdates) return parserRef.generalVars.homecomingUpdates.value;
      if (name === 'currSLocData') {
        try { return parserRef.getHomeCurrSLocData ? parserRef.getHomeCurrSLocData() : undefined; } catch(e) { return undefined; }
      }
      if (name === 'carrots' && parserRef.generalVars && parserRef.generalVars.carrots) return parserRef.generalVars.carrots.value;
      if (flagMem.has(name)) return flagMem.get(name);
      return undefined;
    },
    has(name) { return this.get(name) !== undefined; },
    set(name, value) {
      if (WHITELIST.has(name) && parserRef) {
        if (name === 'homecomingUpdates' && parserRef.writeGeneralVar) {
          if (!parserRef.generalVars || !parserRef.generalVars[name]) { console.debug('[Flags] whitelist miss, no node for', name); flagMem.set(name, value); return false; }
          parserRef.writeGeneralVar(name, value|0);
          console.debug('[Flags] set whitelist', name, value);
          return true;
        }
        if (name === 'currSLocData' && parserRef.setHomeCurrSLocData) {
          const ok = parserRef.setHomeCurrSLocData(value|0);
          console.debug('[Flags] set whitelist', name, value, ok);
          return ok;
        }
        if (name === 'carrots' && parserRef.writeGeneralVar) {
          parserRef.writeGeneralVar(name, value|0);
          console.debug('[Flags] set whitelist', name, value);
          return true;
        }
      }
      flagMem.set(name, value);
      const dbg = (new URLSearchParams(location.search).has('debug') || new URLSearchParams(location.hash).has('debug'));
      if (dbg) console.debug('[Flags] set mem', name, value);
      else console.debug('[Flags] set', name, value);
      return true;
    }
  };

  window.Timers = {
    // shape observado: { id, startTime, minutesActive } via parser.getTempTimers()
    list() {
      if (!parserRef || !parserRef.getTempTimers) return [];
      try { return parserRef.getTempTimers(); } catch(e) { return []; }
    },
    tick(now) {
      const arr = this.list();
      if (!arr || arr.length === 0) return;
      // no-op: no borrar ni reescribir — layout no confirmado. P4 usará ripe vs now
      // shape: [{ astNode, id, startTime, minutesActive }]
      if (new URLSearchParams(location.search).has('debug')) console.debug('[Timers] tick', now, arr.length);
    }
  };

  // Contrato para P4 (no implementar):
  // GameTime.onDayChanged → recalcular ripe de seeds (harvestTimeOA vs Date real)
  // Flags.get("homecomingUpdates") === 1 → mostrar groupNum 2 en sloc 0
})();
