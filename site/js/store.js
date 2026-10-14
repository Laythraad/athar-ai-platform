/* ATHAR IRAQ — local state (localStorage, no server). */
window.Store = (function () {
  var KEY = "mors_v1";
  var state = { lang: null, theme: "auto", visited: {}, key: null, trip: [], events: [] };

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === "object") {
          if (typeof s.lang === "string") state.lang = s.lang;
          if (typeof s.theme === "string") state.theme = s.theme;
          if (s.visited && typeof s.visited === "object") state.visited = s.visited;
          if (typeof s.key === "string") state.key = s.key;
          if (Array.isArray(s.trip)) state.trip = s.trip;
          if (Array.isArray(s.events)) state.events = s.events;
        }
      }
    } catch (e) { /* private mode / file:// restrictions */ }
  }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  load();

  return {
    get: function (k) { return state[k]; },
    set: function (k, v) { state[k] = v; save(); },
    visited: {
      has: function (id) { return !!state.visited[id]; },
      add: function (id) { state.visited[id] = 1; save(); },
      remove: function (id) { delete state.visited[id]; save(); },
      count: function () { return Object.keys(state.visited).length; },
      ids: function () { return Object.keys(state.visited); },
      clear: function () { state.visited = {}; save(); }
    },
    trip: {
      has: function (id) { return state.trip.indexOf(id) !== -1; },
      add: function (id) { if (state.trip.indexOf(id) === -1) state.trip.push(id); save(); },
      remove: function (id) { var i = state.trip.indexOf(id); if (i !== -1) state.trip.splice(i, 1); save(); },
      ids: function () { return state.trip.slice(); },
      clear: function () { state.trip = []; save(); }
    },
    logEvent: function (type, data) {
      state.events.push({ t: type, d: data || null, at: Date.now() });
      if (state.events.length > 500) state.events = state.events.slice(-500);
      save();
    },
    events: function () { return state.events.slice(); },
    clearAll: function () {
      state = { lang: state.lang, theme: state.theme, visited: {}, key: state.key, trip: [], events: [] };
      save();
    }
  };
})();
