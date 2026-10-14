/* MORS HERITAGE — world map: Equal Earth projection over real country borders. */
window.MapView = (function () {
  var NS = "http://www.w3.org/2000/svg";
  var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
  var SQ32 = Math.sqrt(3) / 2;
  var KX = 0.9, KY = 0.9; // mild vertical exaggeration control

  function project(lng, lat) {
    var lam = lng * Math.PI / 180;
    var phi = Math.max(-89.999, Math.min(89.999, lat)) * Math.PI / 180;
    var th = Math.asin(SQ32 * Math.sin(phi));
    var t2 = th * th, t6 = t2 * t2 * t2;
    var den = SQ32 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2));
    var x = lam * Math.cos(th) / den;
    var y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
    return [x * KX, -y * KY]; // flip y for screen coords
  }

  var el = null, svg = null, gRoot = null, gCountries = null, gLabels = null, gMarkers = null;
  var viewBox = { x: 0, y: 0, w: 10, h: 10 };
  var view = { k: 1, tx: 0, ty: 0 };
  var onSelect = null;
  var markers = []; // {site, g, circle, cx, cy, scale}
  var currentLang = "en";

  function el_(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function ringToPath(ring) {
    var d = "", i;
    for (i = 0; i < ring.length; i++) {
      var p = project(ring[i][0], ring[i][1]);
      d += (i ? "L" : "M") + p[0].toFixed(3) + "," + p[1].toFixed(3);
    }
    return d + "Z";
  }

  function labelFor(props) {
    var key = "t" + String(currentLang).toUpperCase();
    if (props[key]) return props[key];
    if (props.tEN) return props.tEN;
    return props.n || "";
  }

  function build() {
    var world = (window.WORLD && window.WORLD.features) ? window.WORLD.features : [];
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    gCountries.innerHTML = "";
    gLabels.innerHTML = "";
    for (var i = 0; i < world.length; i++) {
      var c = world[i];
      var props = c.p || {};
      var d = "";
      var g = c.g || [];
      for (var r = 0; r < g.length; r++) {
        var ring = g[r];
        if (!ring || ring.length < 3) continue;
        d += ringToPath(ring);
      }
      if (!d) continue;
      var path = el_("path", { "class": "map-country", d: d }, gCountries);
      path.dataset.iso = props.iso || "";
      path.dataset.name = props.n || "";
      // bounds
      for (var r2 = 0; r2 < g.length; r2++) {
        for (var p = 0; p < g[r2].length; p++) {
          var pt = project(g[r2][p][0], g[r2][p][1]);
          if (pt[0] < minX) minX = pt[0];
          if (pt[1] < minY) minY = pt[1];
          if (pt[0] > maxX) maxX = pt[0];
          if (pt[1] > maxY) maxY = pt[1];
        }
      }
      if (typeof props.lx === "number" && typeof props.ly === "number") {
        var lp = project(props.lx, props.ly);
        var txt = el_("text", { "class": "map-label", x: lp[0].toFixed(2), y: lp[1].toFixed(2) }, gLabels);
        txt.textContent = labelFor(props);
        txt.dataset.iso = props.iso || "";
      }
    }
    var pad = 0.35;
    viewBox = { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
    svg.setAttribute("viewBox", viewBox.x + " " + viewBox.y + " " + viewBox.w + " " + viewBox.h);
  }

  function unitScale() {
    // sizes are defined relative to the viewBox height so they stay
    // stable without measuring the DOM (which is unreliable at mount time)
    var vh = viewBox.h || 3;
    return {
      marker: (vh * 0.0055) / view.k,
      label: (vh * 0.0125) / view.k,
      countryLabel: (vh * 0.0115) / view.k
    };
  }

  function applyTransform() {
    gRoot.setAttribute("transform", "translate(" + view.tx + "," + view.ty + ") scale(" + view.k + ")");
    var u = unitScale();
    var i;
    for (i = 0; i < markers.length; i++) {
      var m = markers[i];
      var r = m.site.precision === "city" ? u.marker * 0.78 : u.marker;
      m.circle.setAttribute("r", r.toFixed(5));
      m.halo.setAttribute("r", (r * 2.6).toFixed(5));
      m.halo.setAttribute("stroke-width", (r * 0.3).toFixed(5));
      if (m.label) m.label.setAttribute("font-size", u.label.toFixed(5));
    }
    for (i = 0; i < gLabels.children.length; i++) {
      gLabels.children[i].setAttribute("font-size", u.countryLabel.toFixed(5));
    }
  }

  function setMarkers(sites) {
    gMarkers.innerHTML = "";
    markers = [];
    for (var i = 0; i < sites.length; i++) {
      var s = sites[i];
      var p = project(s.lng, s.lat);
      var g = el_("g", { "class": "map-marker " + (s.precision === "city" ? "city" : "exact") }, gMarkers);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      var halo = el_("circle", { cx: p[0], cy: p[1], r: 7, fill: "none", stroke: "#b87333", "stroke-width": 0.8, opacity: 0.85 }, g);
      var circle = el_("circle", { "class": "mk-dot", cx: p[0], cy: p[1], r: 3.2 }, g);
      var title = el_("title", {}, g);
      title.textContent = (s.name && (s.name[currentLang] || s.name.en)) || s.id;
      var m = { site: s, g: g, circle: circle, halo: halo, label: null, cx: p[0], cy: p[1] };
      g.addEventListener("click", function (site) {
        return function (ev) {
          ev.preventDefault();
          if (onSelect) onSelect(site);
        };
      }(s));
      g.addEventListener("keydown", function (site) {
        return function (ev) {
          if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); if (onSelect) onSelect(site); }
        };
      }(s));
      markers.push(m);
    }
    applyTransform();
  }

  function zoomAt(factor, px, py) {
    var k2 = Math.max(0.7, Math.min(14, view.k * factor));
    var ratio = k2 / view.k;
    // keep world point under (px,py) fixed
    view.tx = px - (px - view.tx) * ratio;
    view.ty = py - (py - view.ty) * ratio;
    view.k = k2;
    applyTransform();
  }

  function svgPointFromEvent(ev) {
    var rect = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var scale = Math.min(rect.width / vb.width, rect.height / vb.height);
    var offX = (rect.width - vb.width * scale) / 2;
    var offY = (rect.height - vb.height * scale) / 2;
    var x = (ev.clientX - rect.left - offX) / scale - vb.x;
    var y = (ev.clientY - rect.top - offY) / scale - vb.y;
    return { x: x, y: y };
  }

  function mount(canvas, opts) {
    el = canvas;
    onSelect = opts && opts.onSelect;
    canvas.innerHTML = "";
    svg = el_("svg", { preserveAspectRatio: "xMidYMid meet" }, canvas);
    gRoot = el_("g", {}, svg);
    gCountries = el_("g", {}, gRoot);
    gLabels = el_("g", {}, gRoot);
    gMarkers = el_("g", {}, gRoot);
    build();

    var dragging = false, last = null, moved = 0;
    canvas.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      var pt = svgPointFromEvent(ev);
      zoomAt(ev.deltaY < 0 ? 1.18 : 1 / 1.18, pt.x, pt.y);
    }, { passive: false });
    canvas.addEventListener("pointerdown", function (ev) {
      dragging = true; moved = 0;
      last = { x: ev.clientX, y: ev.clientY };
      canvas.classList.add("dragging");
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener("pointermove", function (ev) {
      if (!dragging || !last) return;
      var rect = svg.getBoundingClientRect();
      var vb = svg.viewBox.baseVal;
      var scale = Math.min(rect.width / vb.width, rect.height / vb.height);
      var dx = (ev.clientX - last.x) / scale;
      var dy = (ev.clientY - last.y) / scale;
      moved += Math.abs(ev.clientX - last.x) + Math.abs(ev.clientY - last.y);
      view.tx += dx; view.ty += dy;
      last = { x: ev.clientX, y: ev.clientY };
      applyTransform();
    });
    function endDrag(ev) {
      dragging = false; last = null;
      canvas.classList.remove("dragging");
      try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { applyTransform(); });
      ro.observe(canvas);
    } else {
      window.addEventListener("resize", function () { applyTransform(); });
    }
    return { zoomBy: function (f) { zoomAt(f, viewBox.w / 2, viewBox.h / 2); }, reset: function () { view = { k: 1, tx: 0, ty: 0 }; applyTransform(); } };
  }

  return {
    mount: mount,
    setMarkers: setMarkers,
    refreshLabels: function (lang) { currentLang = lang; build(); applyTransform(); }
  };
})();
