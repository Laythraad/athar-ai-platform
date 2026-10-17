/* ATHAR IRAQ — application shell: routing, views, passport, AI, settings. */
window.App = (function () {
  var SITES = window.SITES || [];
  var IQ = SITES.filter(function (s) { return s.country && s.country.iso === "IQ"; });
  var filters = { q: "", gov: "", interest: "", country: "", category: "", region: "", sort: "rec", world: false };
  var planState = { gov: "", days: 3, pace: "balanced", interests: {} };
  var aiHistory = [];
  var aiMsgSeq = 0;
  var aiEmptyNode = null;
  var mapView = null;
  var mapReady = false;
  var speechVoices = [];
  var lastPlan = null;
  var filtersUiBuilt = false;
  var planUiBuilt = false;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function t(k, p) { return window.I18n.t(k, p); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function lang() { return window.I18n.lang(); }
  function pick(obj) { return (obj && (obj[lang()] || obj.en)) || ""; }
  function siteName(s) { return pick(s.name); }
  function siteCountry(s) { return pick(s.country); }
  function siteCity(s) { return pick(s.city); }
  function siteGov(s) { return s.governorate ? pick(s.governorate) : ""; }
  function siteSummary(s) { return pick(s.summary); }
  function siteSignificance(s) { return pick(s.significance); }
  function siteEra(s) { return pick(s.era); }
  function factsOf(s) { return (s.facts || []).map(function (f) { return pick(f); }).filter(Boolean); }
  function byId(id) {
    for (var i = 0; i < SITES.length; i++) if (SITES[i].id === id) return SITES[i];
    return null;
  }
  function precisionLabel(p) {
    return p === "verified" ? t("d_precision_verified") : p === "city" ? t("d_precision_city") : t("d_precision_site");
  }
  function precisionClass(p) { return p === "city" ? "pill-city" : "pill-exact"; }
  function catLabel(c) { return t("cat_" + c); }
  function contLabel(c) {
    return { "Asia": t("cont_asia"), "Europe": t("cont_europe"), "Africa": t("cont_africa"),
      "North America": t("cont_na"), "South America": t("cont_sa"), "Oceania": t("cont_oceania") }[c] || c;
  }
  function haversine(a, b, c, d) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (c - a) * toR, dLng = (d - b) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a * toR) * Math.cos(c * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function travelMinutes(km) {
    var road = km * 1.3;
    return Math.max(10, Math.round(road / 50 * 60 + 15));
  }
  function mapsUrl(s) {
    return "https://www.google.com/maps/search/?api=1&query=" + s.lat + "," + s.lng;
  }
  function uniqueGovs(list) {
    var seen = {}, out = [];
    list.forEach(function (s) {
      if (!s.governorate) return;
      var k = s.governorate.en;
      if (seen[k]) return;
      seen[k] = 1;
      out.push({ en: s.governorate.en, ar: s.governorate.ar, label: pick(s.governorate) });
    });
    out.sort(function (a, b) { return a.en.localeCompare(b.en); });
    return out;
  }
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------- routing ---------- */
  function parseHash() {
    var h = (location.hash || "#/home").replace(/^#\/?/, "");
    var parts = h.split("/");
    return { view: parts[0] || "home", arg: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  function go(view, arg) { location.hash = "#/" + view + (arg ? "/" + encodeURIComponent(arg) : ""); }

  function route() {
    var r = parseHash();
    $$(".view").forEach(function (v) { v.hidden = true; });
    $$("#nav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-nav") === r.view); });
    var nav = $("#nav"); nav.classList.remove("open"); $("#burger").setAttribute("aria-expanded", "false");

    switch (r.view) {
      case "explore": $("#view-explore").hidden = false; renderExplore(); break;
      case "detail": $("#view-detail").hidden = false; renderDetail(r.arg); break;
      case "map": $("#view-map").hidden = false; renderMap(r.arg); break;
      case "plan": $("#view-plan").hidden = false; renderPlan(); break;
      case "space": $("#view-space").hidden = false; renderSpace(); break;
      case "learn": $("#view-learn").hidden = false; renderLearn(); break;
      case "passport": $("#view-passport").hidden = false; renderPassport(); break;
      case "ai": $("#view-ai").hidden = false; break;
      case "trust": $("#view-trust").hidden = false; renderTrust(); break;
      case "settings": $("#view-settings").hidden = false; break;
      default: $("#view-home").hidden = false; renderHome(); break;
    }
    window.scrollTo(0, 0);
  }

  /* ---------- home ---------- */
  function featured() {
    var ids = ["iq-babylon", "iq-ur-ziggurat", "iq-hatra", "iq-marshes", "iq-erbil-citadel", "iq-samarra-mosque", "iq-ashur", "iq-national-museum"];
    var out = [];
    ids.forEach(function (id) { var s = byId(id); if (s) out.push(s); });
    IQ.forEach(function (s) { if (out.length < 8 && out.indexOf(s) === -1) out.push(s); });
    return out.slice(0, 8);
  }

  function cardHTML(s) {
    return '<a class="card" href="#/detail/' + encodeURIComponent(s.id) + '">' +
      '<div class="card-top"><span class="cat">' + esc(catLabel(s.cat)) + "</span>" +
      '<span class="pill ' + precisionClass(s.precision) + '">' + esc(precisionLabel(s.precision)) + "</span></div>" +
      "<h3>" + esc(siteName(s)) + "</h3>" +
      '<span class="country">' + esc(siteCountry(s)) + (siteGov(s) ? " · " + esc(siteGov(s)) : siteCity(s) ? " · " + esc(siteCity(s)) : "") + "</span>" +
      '<p class="sum">' + esc(siteSummary(s)) + "</p>" +
      '<div class="card-foot"><span>' + s.visit + " " + t("d_min") + "</span>" +
      (s.source && s.source.url ? "<span>" + esc(s.source.publisher || t("d_source")) + "</span>" : "") +
      "</div></a>";
  }

  function renderHome() {
    $("#featuredGrid").innerHTML = featured().map(cardHTML).join("");
    var govs = uniqueGovs(IQ);
    $("#continentGrid").innerHTML = govs.map(function (g) {
      var n = IQ.filter(function (s) { return s.governorate && s.governorate.en === g.en; }).length;
      return '<a class="continent" href="#/explore" data-gov="' + esc(g.en) + '"><b>' + esc(g.label) + "</b><span>" + n + "</span></a>";
    }).join("");
    $$("#continentGrid .continent").forEach(function (a) {
      a.addEventListener("click", function () {
        filters.gov = a.getAttribute("data-gov");
        filters.world = false; filters.country = ""; filters.category = ""; filters.interest = ""; filters.region = ""; filters.q = "";
      });
    });
    var sourced = 0;
    SITES.forEach(function (s) { if (s.source && s.source.url) sourced++; });
    $("#statSites").textContent = SITES.length;
    $("#statCountries").textContent = govs.length;
    $("#statLangs").textContent = window.LANGS.length;
    $("#statSources").textContent = sourced;
    $("#heroCount").textContent = IQ.length;
  }

  /* ---------- explore ---------- */
  function fillSelect(sel, items, allLabel, value) {
    sel.innerHTML = '<option value="">' + esc(allLabel) + "</option>" +
      items.map(function (it) { return '<option value="' + esc(it.v) + '">' + esc(it.l) + "</option>"; }).join("");
    sel.value = value || "";
  }

  function ensureFiltersUI() {
    var gSel = $("#fGov");
    if (!filtersUiBuilt || gSel.options.length <= 1) {
      filtersUiBuilt = true;
      fillSelect(gSel, uniqueGovs(IQ).map(function (g) { return { v: g.en, l: g.label }; }), t("exp_all"), filters.gov);
      var countries = {}, regions = {}, cats = {};
      SITES.forEach(function (s) {
        countries[s.country.iso + "|" + s.country.en] = 1;
        if (s.region) regions[s.region] = 1;
        cats[s.cat] = 1;
      });
      var cSel = $("#fCountry");
      cSel.innerHTML = '<option value="">' + esc(t("exp_all")) + "</option>" +
        Object.keys(countries).sort(function (a, b) {
          return a.split("|")[1].localeCompare(b.split("|")[1]);
        }).map(function (k) {
          var iso = k.split("|")[0], en = k.split("|")[1];
          var s = SITES.filter(function (x) { return x.country.iso === iso; })[0];
          return '<option value="' + esc(iso) + '">' + esc(s ? siteCountry(s) : en) + "</option>";
        }).join("");
      fillSelect($("#fCategory"), Object.keys(cats).sort().map(function (c) { return { v: c, l: catLabel(c) }; }), t("exp_all"), filters.category);
      fillSelect($("#fRegion"), Object.keys(regions).sort().map(function (r) { return { v: r, l: r }; }), t("exp_all"), filters.region);
      var tagSet = {};
      IQ.forEach(function (s) { (s.tags || []).forEach(function (tag) { tagSet[String(tag).toLowerCase()] = 1; }); });
      fillSelect($("#fInterest"), Object.keys(tagSet).sort().map(function (x) { return { v: x, l: x }; }), t("exp_all"), filters.interest);
    }
  }

  function filtered() {
    var q = filters.q.trim().toLowerCase();
    var pool = filters.world ? SITES : IQ;
    var out = pool.filter(function (s) {
      if (!filters.world && s.country.iso !== "IQ") return false;
      if (filters.gov && (!s.governorate || s.governorate.en !== filters.gov)) return false;
      if (filters.country && s.country.iso !== filters.country) return false;
      if (filters.category && s.cat !== filters.category) return false;
      if (filters.region && s.region !== filters.region) return false;
      if (filters.interest) {
        var tags = (s.tags || []).map(function (x) { return String(x).toLowerCase(); });
        if (tags.indexOf(filters.interest) === -1 && String(s.cat).toLowerCase() !== filters.interest) return false;
      }
      if (!q) return true;
      var hay = [s.name.en, s.name.ar, s.country.en, s.country.ar, s.city && s.city.en, s.city && s.city.ar,
        s.governorate && s.governorate.en, s.governorate && s.governorate.ar,
        s.cat, s.region, (s.tags || []).join(" "), s.summary.en].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    if (filters.sort === "az") {
      out.sort(function (a, b) { return siteName(a).localeCompare(siteName(b)); });
    } else if (filters.sort === "near" && userPos) {
      out.sort(function (a, b) {
        return haversine(userPos.lat, userPos.lng, a.lat, a.lng) - haversine(userPos.lat, userPos.lng, b.lat, b.lng);
      });
    }
    return out;
  }

  var userPos = null;

  function ensureUserPos() {
    if (userPos) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (filters.sort === "near") renderExplore();
    }, null, { maximumAge: 300000, timeout: 8000 });
  }

  function renderExplore() {
    ensureFiltersUI();
    var poolN = filters.world ? SITES.length : IQ.length;
    $("#expSub").textContent = t("exp_sub", { n: poolN });
    $("#expSearch").placeholder = t("exp_search_ph");
    $("#expSearch").value = filters.q;
    $("#fGov").value = filters.gov;
    $("#fCountry").value = filters.country;
    $("#fCategory").value = filters.category;
    $("#fRegion").value = filters.region;
    $("#fInterest").value = filters.interest;
    $("#fSort").value = filters.sort;
    $("#expWorld").textContent = filters.world ? t("exp_world") + " ✓" : t("exp_world");
    $("#expWorld").classList.toggle("btn-gold", filters.world);
    var list = filtered();
    $("#expCount").textContent = t("exp_results", { n: list.length });
    $("#expGrid").innerHTML = list.map(cardHTML).join("");
    $("#expEmpty").hidden = list.length > 0;
    $("#expGrid").hidden = list.length === 0;
  }

  /* ---------- detail ---------- */
  function relatedOf(s) {
    var out = SITES.filter(function (o) { return o.id !== s.id; })
      .map(function (o) {
        var score = 0;
        if (s.governorate && o.governorate && o.governorate.en === s.governorate.en) score += 3;
        if (o.cat === s.cat) score += 2;
        if (o.country.iso === s.country.iso) score += 1;
        return { o: o, score: score, d: haversine(s.lat, s.lng, o.lat, o.lng) };
      })
      .filter(function (x) { return x.score >= 2; })
      .sort(function (a, b) { return b.score - a.score || a.d - b.d; })
      .slice(0, 5);
    return out;
  }

  function renderDetail(id) {
    var s = byId(id);
    var body = $("#detailBody");
    if (!s) { body.innerHTML = "<h1>" + esc(t("d_not_found")) + '</h1><p><a class="btn btn-gold btn-small" href="#/explore">' + esc(t("d_back_explore")) + "</a></p>"; return; }
    var visited = window.Store.visited.has(s.id);
    var inTrip = window.Store.trip.has(s.id);
    var facts = factsOf(s).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("");
    var tags = (s.tags || []).map(function (x) { return '<span class="pill">' + esc(x) + "</span>"; }).join(" ");
    var src = s.source && s.source.url
      ? '<a href="' + esc(s.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.source.title || t("d_source")) + "</a><br><span class='muted tiny'>" + esc(s.source.publisher || "") + " · " + esc(s.source.checked || "") + "</span>"
      : '<span class="muted">' + esc(t("learn_no_source")) + "</span>";
    var related = relatedOf(s);

    body.innerHTML =
      '<p><a class="btn btn-ghost btn-small" href="#/explore">' + esc(t("d_back_explore")) + "</a></p>" +
      '<div class="detail-head"><div>' +
      '<span class="cat">' + esc(catLabel(s.cat)) + "</span>" +
      "<h1>" + esc(siteName(s)) + "</h1>" +
      '<p class="muted">' + esc(siteCountry(s)) + (siteGov(s) ? " · " + esc(siteGov(s)) : "") + (siteCity(s) && !siteGov(s) ? " · " + esc(siteCity(s)) : "") + " · " + esc(contLabel(s.continent)) + "</p>" +
      "</div></div>" +
      '<div class="detail-meta">' +
      '<span class="pill ' + precisionClass(s.precision) + '">' + esc(precisionLabel(s.precision)) + "</span>" +
      '<span class="pill">' + s.visit + " " + esc(t("d_min")) + "</span>" +
      (s.era ? '<span class="pill">' + esc(siteEra(s)) + "</span>" : "") +
      "</div>" +
      '<div class="empty tiny" style="text-align:start;padding:1rem">' + esc(t("d_no_photo")) + "</div>" +
      '<div class="detail-actions">' +
      '<button class="btn ' + (visited ? "btn-ghost" : "btn-gold") + '" id="visitBtn" type="button">' + esc(visited ? t("d_unvisit") : t("d_mark")) + "</button>" +
      '<button class="btn ' + (inTrip ? "btn-ghost" : "btn-gold") + '" id="tripBtn" type="button">' + esc(inTrip ? t("d_add_trip") + " ✓" : t("d_add_trip")) + "</button>" +
      '<a class="btn btn-ghost" href="' + esc(mapsUrl(s)) + '" target="_blank" rel="noopener noreferrer">' + esc(t("d_open_maps")) + "</a>" +
      '<button class="btn btn-ghost" id="shareBtn" type="button">' + esc(t("d_share")) + "</button>" +
      '<button class="btn btn-ghost" id="listenBtn" type="button">' + esc(t("d_listen")) + "</button>" +
      '<button class="btn btn-ghost" id="askAiBtn" type="button">' + esc(t("d_ask_ai")) + "</button>" +
      '<button class="btn btn-ghost" id="mapBtn" type="button">' + esc(t("d_on_map")) + "</button>" +
      "</div>" +
      '<div class="detail-grid"><div class="prose">' +
      "<h2>" + esc(t("d_summary")) + "</h2><p>" + esc(siteSummary(s)) + "</p>" +
      "<h2>" + esc(t("d_significance")) + "</h2><p>" + esc(siteSignificance(s)) + "</p>" +
      (facts ? "<h2>" + esc(t("d_facts")) + '</h2><ul class="facts">' + facts + "</ul>" : "") +
      "</div><div>" +
      '<div class="side-card"><h3>' + esc(t("d_precision")) + "</h3>" +
      '<p class="muted tiny">' + esc(t("d_precision_help")) + "</p>" +
      '<div class="kv"><span>' + esc(t("d_coords")) + "</span><span>" + s.lat.toFixed(4) + ", " + s.lng.toFixed(4) + "</span></div>" +
      '<div class="kv"><span>' + esc(t("d_visit_min")) + "</span><span>" + s.visit + " " + esc(t("d_min")) + "</span></div>" +
      (s.era ? '<div class="kv"><span>' + esc(t("d_era")) + "</span><span>" + esc(siteEra(s)) + "</span></div>" : "") +
      (siteGov(s) ? '<div class="kv"><span>' + esc(t("d_governorate")) + "</span><span>" + esc(siteGov(s)) + "</span></div>" : "") +
      '<div class="kv"><span>' + esc(t("d_country")) + "</span><span>" + esc(siteCountry(s)) + "</span></div>" +
      (siteCity(s) ? '<div class="kv"><span>' + esc(t("d_city")) + "</span><span>" + esc(siteCity(s)) + "</span></div>" : "") +
      '<div class="kv"><span>' + esc(t("d_hours_na")) + "</span><span>—</span></div>" +
      '<div class="kv"><span>' + esc(t("d_fees_na")) + "</span><span>—</span></div>" +
      (s.lastVerifiedAt ? '<div class="kv"><span>' + esc(t("d_last_verified")) + "</span><span>" + esc(s.lastVerifiedAt) + "</span></div>" : "") +
      "</div>" +
      '<div class="side-card"><h3>' + esc(t("d_source")) + "</h3><p>" + src + "</p></div>" +
      (tags ? '<div class="side-card"><h3>' + esc(t("d_tags")) + "</h3><p>" + tags + "</p></div>" : "") +
      (related.length ? '<div class="side-card"><h3>' + esc(t("d_related")) + '</h3><div class="nearby-list">' +
        related.map(function (n) {
          return '<a href="#/detail/' + encodeURIComponent(n.o.id) + '"><span>' + esc(siteName(n.o)) + "</span><span class='muted'>" + Math.round(n.d) + " km</span></a>";
        }).join("") + "</div></div>" : "") +
      "</div></div>";

    $("#visitBtn").addEventListener("click", function () {
      if (window.Store.visited.has(s.id)) {
        window.Store.visited.remove(s.id);
        toast(t("toast_unvisited"));
      } else {
        window.Store.visited.add(s.id);
        toast(t("toast_visited"));
      }
      renderDetail(s.id);
    });
    $("#tripBtn").addEventListener("click", function () {
      if (window.Store.trip.has(s.id)) {
        window.Store.trip.remove(s.id);
      } else {
        window.Store.trip.add(s.id);
      }
      renderDetail(s.id);
    });
    $("#shareBtn").addEventListener("click", function () {
      var url = location.href.split("#")[0] + "#/detail/" + encodeURIComponent(s.id);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast(t("d_copied")); }, function () { toast(url); });
      } else { toast(url); }
    });
    $("#listenBtn").addEventListener("click", function () { speakDetail(s, this); });
    $("#askAiBtn").addEventListener("click", function () {
      aiPrefill = siteName(s);
      go("ai");
      setTimeout(function () { sendAi(siteName(s)); }, 60);
    });
    $("#mapBtn").addEventListener("click", function () { go("map", s.id); });
  }

  var aiPrefill = null;

  /* ---------- plan ---------- */
  var PACE_MIN = { relaxed: 180, balanced: 300, packed: 420 };

  function renderPlan() {
    var gSel = $("#planGov");
    if (!planUiBuilt || gSel.options.length <= 1) {
      planUiBuilt = true;
      fillSelect(gSel, uniqueGovs(IQ).map(function (g) { return { v: g.en, l: g.label }; }), t("exp_all"), planState.gov);
      var cats = {};
      IQ.forEach(function (s) { cats[s.cat] = 1; });
      $("#planInterests").innerHTML = Object.keys(cats).sort().map(function (c) {
        return '<button class="chip' + (planState.interests[c] ? " on" : "") + '" type="button" data-cat="' + esc(c) + '">' + esc(catLabel(c)) + "</button>";
      }).join("");
      $$("#planInterests .chip").forEach(function (b) {
        b.addEventListener("click", function () {
          var c = b.getAttribute("data-cat");
          if (planState.interests[c]) delete planState.interests[c]; else planState.interests[c] = 1;
          b.classList.toggle("on");
        });
      });
    }
    gSel.value = planState.gov;
    $("#planDays").value = String(planState.days);
    $("#planPace").value = planState.pace;
    renderTripList();
  }

  function renderTripList() {
    var el = $("#planTrip");
    if (!el) return;
    var ids = window.Store.trip.ids();
    if (!ids.length) {
      el.innerHTML = '<p class="muted tiny">' + esc(t("plan_no_trip")) + "</p>";
      return;
    }
    var items = ids.map(byId).filter(Boolean);
    var html = "<h3>" + esc(t("plan_trip_title", { n: items.length })) + "</h3>";
    html += '<div class="nearby-list">';
    items.forEach(function (s) {
      html += '<div class="quest"><div><b>' + esc(siteName(s)) + "</b>" +
        (s.governorate ? " · " + esc(siteGov(s)) : "") +
        '<br><span class="muted tiny">' + s.visit + " " + esc(t("d_min")) + "</span></div>" +
        '<button class="btn btn-ghost btn-small" type="button" data-trip-rm="' + esc(s.id) + '">' + esc(t("d_remove")) + "</button></div>";
    });
    html += "</div>";
    html += '<button class="btn btn-ghost btn-small" id="tripClear" type="button" style="margin-top:.5rem">' + esc(t("plan_trip_clear")) + "</button>";
    el.innerHTML = html;
    $$("#planTrip [data-trip-rm]").forEach(function (b) {
      b.addEventListener("click", function () {
        window.Store.trip.remove(b.getAttribute("data-trip-rm"));
        renderTripList();
      });
    });
    var clearBtn = $("#tripClear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        window.Store.trip.clear();
        renderTripList();
        toast(t("toast_reset"));
      });
    }
  }

  function buildPlan() {
    var gov = $("#planGov").value;
    var days = parseInt($("#planDays").value, 10) || 3;
    var pace = $("#planPace").value;
    var interests = {};
    $$("#planInterests .chip.on").forEach(function (b) { interests[b.getAttribute("data-cat")] = 1; });
    planState.gov = gov; planState.days = days; planState.pace = pace; planState.interests = interests;

    var pool = IQ.filter(function (s) {
      if (gov && (!s.governorate || s.governorate.en !== gov)) return false;
      if (Object.keys(interests).length && !interests[s.cat]) return false;
      return true;
    });
    var out = $("#planOut");
    if (!pool.length) {
      out.innerHTML = '<div class="empty"><p>' + esc(t("plan_no_sites")) + "</p></div>";
      lastPlan = null;
      return;
    }

    var budget = PACE_MIN[pace] || 300;
    var remaining = pool.slice().sort(function (a, b) {
      if (a.visit !== b.visit) return b.visit - a.visit;
      return siteName(a).localeCompare(siteName(b));
    });
    var dayList = [];
    var cur = [], used = 0, prev = null;
    while (remaining.length && dayList.length < days) {
      var bestI = -1, bestScore = -Infinity;
      for (var i = 0; i < remaining.length; i++) {
        var cand = remaining[i];
        var travel = prev ? travelMinutes(haversine(prev.lat, prev.lng, cand.lat, cand.lng)) : 0;
        var total = used + travel + cand.visit;
        var fits = total <= budget + 60;
        var score = (fits ? 100 : 0) + (prev ? -haversine(prev.lat, prev.lng, cand.lat, cand.lng) : cand.visit);
        if (score > bestScore) { bestScore = score; bestI = i; }
      }
      if (bestI === -1) break;
      var pickSite = remaining.splice(bestI, 1)[0];
      var tr = prev ? travelMinutes(haversine(prev.lat, prev.lng, pickSite.lat, pickSite.lng)) : 0;
      if (cur.length && used + tr + pickSite.visit > budget + 60) {
        dayList.push(cur); cur = []; used = 0; prev = null; tr = 0;
        remaining.unshift(pickSite);
        continue;
      }
      cur.push({ site: pickSite, travel: tr });
      used += tr + pickSite.visit;
      prev = pickSite;
      if (used >= budget * 0.85 && remaining.length && dayList.length < days - 1) {
        dayList.push(cur); cur = []; used = 0; prev = null;
      }
    }
    if (cur.length) dayList.push(cur);

    var totalVisit = 0, html = "";
    html += '<div class="set-card"><p class="muted tiny">' + esc(t("plan_null_note")) + "</p>";
    html += "<h2>" + esc(t("plan_title")) + (gov ? " · " + esc(gov) : "") + "</h2>";
    dayList.forEach(function (day, di) {
      html += "<h3>" + esc(t("plan_day", { n: di + 1 })) + "</h3>";
      html += '<div class="quests">';
      day.forEach(function (stop) {
        var s = stop.site;
        totalVisit += s.visit;
        html += '<div class="quest"><div>' +
          "<b>" + esc(siteName(s)) + "</b> · " + esc(catLabel(s.cat)) +
          (s.governorate ? " · " + esc(siteGov(s)) : "") +
          '<br><span class="muted tiny">' + s.visit + " " + esc(t("d_min")) +
          (stop.travel ? " · " + esc(t("plan_travel_est")) + " ~" + stop.travel + " " + esc(t("d_min")) : "") +
          "</span>" +
          '<br><span class="muted tiny">' + esc(t("d_hours_na")) + " " + esc(t("d_fees_na")) + "</span>" +
          (s.source && s.source.url ? '<br><span class="muted tiny">' + esc(t("d_source")) + ": " + esc(s.source.publisher || s.source.title || "") + "</span>" : "") +
          "</div>" +
          '<div style="display:flex;gap:.4rem;flex-wrap:wrap">' +
          '<a class="btn btn-ghost btn-small" href="' + esc(mapsUrl(s)) + '" target="_blank" rel="noopener noreferrer">' + esc(t("d_open_maps")) + "</a>" +
          '<button class="btn btn-ghost btn-small" type="button" data-trip="' + esc(s.id) + '">' + esc(t("d_add_trip")) + "</button>" +
          "</div></div>";
      });
      html += "</div>";
    });
    html += '<p class="muted">' + esc(t("plan_total")) + ": " + totalVisit + " " + esc(t("d_min")) + "</p></div>";
    out.innerHTML = html;
    $$("#planOut [data-trip]").forEach(function (b) {
      b.addEventListener("click", function () {
        window.Store.trip.add(b.getAttribute("data-trip"));
        toast(t("toast_trip_added"));
        b.textContent = t("d_add_trip") + " ✓";
      });
    });
    lastPlan = dayList;
  }

  /* ---------- space ---------- */
  var SPACE_SITES = null;
  function getSpaceSites() {
    if (!SPACE_SITES) {
      SPACE_SITES = (window.SITES || []).filter(function (s) {
        return s.cat === "space" || s.cat === "science" ||
               (s.tags && s.tags.some(function (t) {
                return /astronomy|space|telescope|observatory|rocket|NASA|ESA|launch/i.test(t);
               }));
      });
    }
    return SPACE_SITES;
  }

  function spaceCard(s) {
    var catBadge = s.cat === "space" ? t("cat_space") : catLabel(s.cat);
    return '<a class="card" href="#/detail/' + encodeURIComponent(s.id) + '">' +
      '<div class="card-top"><span class="cat">' + esc(catBadge) + "</span>" +
      '<span class="pill">' + esc(s.country ? siteCountry(s) : "") + "</span></div>" +
      "<h3>" + esc(siteName(s)) + "</h3>" +
      '<span class="country">' + esc(siteCity(s) || siteGov(s) || "") + "</span>" +
      '<p class="sum">' + esc(siteSummary(s)) + "</p>" +
      '<div class="card-foot"><span>' + s.visit + " " + t("d_min") + "</span>" +
      (s.source && s.source.url ? "<span>" + esc(s.source.publisher || t("d_source")) + "</span>" : "") +
      "</div></a>";
  }

  function renderSpace() {
    var sites = getSpaceSites();
    var q = ($("#spaceQ") && $("#spaceQ").value || "").trim().toLowerCase();
    var cat = $("#spaceCat") ? $("#spaceCat").value : "";
    var sort = $("#spaceSort") ? $("#spaceSort").value : "az";

    var out = sites.filter(function (s) {
      if (cat && s.cat !== cat && !(cat === "observatory" && s.tags && s.tags.some(function (t) { return /observatory/i.test(t); }))) return false;
      if (!q) return true;
      var hay = [siteName(s), siteCountry(s), siteCity(s), siteSummary(s), (s.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    if (sort === "visit") out.sort(function (a, b) { return b.visit - a.visit; });
    else if (sort === "near") {
      if (!userPos && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
          userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          renderSpace();
        }, function () { /* denied */ }, { timeout: 5000, maximumAge: 60000 });
      }
      if (userPos) out.sort(function (a, b) {
        return haversine(userPos.lat, userPos.lng, a.lat, a.lng) - haversine(userPos.lat, userPos.lng, b.lat, b.lng);
      });
      else out.sort(function (a, b) { return siteName(a).localeCompare(siteName(b)); });
    }
    else out.sort(function (a, b) { return siteName(a).localeCompare(siteName(b)); });

    $("#spaceGrid").innerHTML = out.map(spaceCard).join("");
    $("#spaceEmpty").hidden = out.length > 0;
    $("#spaceGrid").hidden = out.length === 0;

    // Wire filter events once
    if (!renderSpace._wired) {
      ["spaceQ", "spaceCat", "spaceSort"].forEach(function (id) {
        var el = $("#" + id);
        if (el) el.addEventListener("input", renderSpace);
      });
      renderSpace._wired = true;
    }
  }

  /* ---------- learn ---------- */
  function learnCard(item, showAuthor, showLoc) {
    var name = pick(item.name);
    var desc = pick(item.desc);
    var author = showAuthor && item.author ? pick(item.author) : null;
    var loc = showLoc && item.loc ? pick(item.loc) : null;
    var src = item.source && item.source.url
      ? '<a href="' + esc(item.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t("learn_visit")) + "</a>"
      : '<span class="muted">' + esc(t("learn_no_source")) + "</span>";
    var meta = [];
    if (author) meta.push(esc(t("learn_by")) + " " + esc(author));
    if (loc) meta.push(esc(t("learn_in")) + " " + esc(loc));
    return '<div class="learn-card">' +
      "<h3>" + esc(name) + "</h3>" +
      (meta.length ? '<p class="learn-meta">' + meta.join(" · ") + "</p>" : "") +
      '<p class="learn-desc">' + esc(desc) + "</p>" +
      '<p class="learn-src">' + src + "</p>" +
      "</div>";
  }

  function renderLearn() {
    var D = window.LEARN_DATA || {};
    var books = (D.books || []).map(function (b) { return learnCard(b, true, false); }).join("");
    var mags = (D.magazines || []).map(function (m) { return learnCard(m, false, false); }).join("");
    var inits = (D.initiatives || []).map(function (i) { return learnCard(i, false, false); }).join("");
    var gather = (D.gathering || []).map(function (g) { return learnCard(g, false, true); }).join("");
    $("#learnBooks").innerHTML = books;
    $("#learnMagazines").innerHTML = mags;
    $("#learnInitiatives").innerHTML = inits;
    $("#learnGathering").innerHTML = gather;
  }

  /* ---------- map ---------- */
  function renderMap(selectId) {
    if (!mapReady) {
      mapView = window.MapView.mount($("#mapCanvas"), {
        onSelect: function (site) { showMapPanel(site); }
      });
      mapReady = true;
      mapView.reset();
      $("#mapZoomIn").addEventListener("click", function () { mapView.zoomBy(1.35); });
      $("#mapZoomOut").addEventListener("click", function () { mapView.zoomBy(1 / 1.35); });
      $("#mapReset").addEventListener("click", function () { mapView.reset(); });
    }
    window.MapView.setMarkers(SITES);
    window.MapView.refreshLabels(lang());
    $("#mapCount").textContent = t("map_count", { n: SITES.length });
    if (selectId) {
      var s = byId(selectId);
      if (s) showMapPanel(s);
    } else {
      $("#mapPanel").hidden = true;
    }
  }

  function showMapPanel(s) {
    var p = $("#mapPanel");
    p.hidden = false;
    p.innerHTML = "<h3>" + esc(siteName(s)) + "</h3>" +
      '<p class="muted tiny">' + esc(siteCountry(s)) + (siteGov(s) ? " · " + esc(siteGov(s)) : siteCity(s) ? " · " + esc(siteCity(s)) : "") + " · " + esc(precisionLabel(s.precision)) + "</p>" +
      '<p class="tiny">' + esc(siteSummary(s).slice(0, 140)) + (siteSummary(s).length > 140 ? "…" : "") + "</p>" +
      '<a class="btn btn-gold btn-small" href="#/detail/' + encodeURIComponent(s.id) + '">' + esc(t("map_open")) + "</a>";
  }

  /* ---------- passport ---------- */
  var BADGES = [
    { id: "first", name: "badge_first", desc: "badge_first_d", test: function (v) { return v.length >= 1; } },
    { id: "three", name: "badge_three", desc: "badge_three_d", test: function (v) { return countBy(v, function (s) { return s.continent; }) >= 3; } },
    { id: "iraq", name: "badge_iraq", desc: "badge_iraq_d", test: function (v) { return v.filter(function (s) { return s.country.iso === "IQ"; }).length >= 5; } },
    { id: "europe", name: "badge_europe", desc: "badge_europe_d", test: function (v) { return v.filter(function (s) { return s.continent === "Europe"; }).length >= 5; } },
    { id: "museum", name: "badge_museum", desc: "badge_museum_d", test: function (v) { return v.filter(function (s) { return s.cat === "museum"; }).length >= 3; } },
    { id: "food", name: "badge_food", desc: "badge_food_d", test: function (v) { return v.filter(function (s) { return s.cat === "food" || s.cat === "market"; }).length >= 3; } },
    { id: "allcats", name: "badge_allcats", desc: "badge_allcats_d", test: function (v) { return countBy(v, function (s) { return s.cat; }) >= 6; } },
    { id: "spacefirst", name: "space_badge_first", desc: "space_badge_first_d", test: function (v) { return v.some(function (s) { return s.cat === "space" || s.cat === "science"; }); } },
    { id: "stargazer", name: "space_badge_obs", desc: "space_badge_obs_d", test: function (v) { return v.filter(function (s) { return s.tags && s.tags.some(function (t) { return /observatory/i.test(t); }); }).length >= 3; } },
    { id: "tothestars", name: "space_badge_launch", desc: "space_badge_launch_d", test: function (v) { return v.some(function (s) { return s.tags && s.tags.some(function (t) { return /launch site/i.test(t); }); }); } },
    { id: "half", name: "badge_half", desc: "badge_half_d", test: function (v) { return v.length * 2 >= SITES.length; } }
  ];

  function countBy(list, fn) { var o = {}; list.forEach(function (x) { o[fn(x)] = 1; }); return Object.keys(o).length; }
  function visitedSites() { return window.Store.visited.ids().map(byId).filter(Boolean); }

  var QUESTS = [
    { id: "desert", text: "quest_desert", done: function (v) { return has(v, "iq-babylon") && has(v, "iq-ur-ziggurat") && has(v, "iq-marshes"); } },
    { id: "capitals", text: "quest_capitals", done: function (v) {
        return has(v, "iq-ctesiphon") && (has(v, "iq-nineveh") || has(v, "iq-ashur")) &&
          v.some(function (s) { return s.continent === "Europe" && (s.cat === "archaeology" || s.cat === "heritage"); });
      } },
    { id: "south", text: "quest_south", done: function (v) {
        return v.filter(function (s) { return s.country.iso === "IQ" && s.lat < 32.7; }).length >= 3;
      } },
    { id: "east", text: "quest_east", done: function (v) { return v.filter(function (s) { return s.continent === "Asia" && s.country.iso !== "IQ"; }).length >= 3; } },
    { id: "africa", text: "quest_africa", done: function (v) {
        return v.filter(function (s) { return s.continent === "Africa" && s.region !== "Middle East & North Africa"; }).length >= 3;
      } }
  ];
  function has(v, id) { for (var i = 0; i < v.length; i++) if (v[i].id === id) return true; return false; }

  function levelOf(n) {
    if (n >= 60) return t("pp_level4");
    if (n >= 30) return t("pp_level3");
    if (n >= 15) return t("pp_level2");
    if (n >= 5) return t("pp_level1");
    return t("pp_level0");
  }

  function renderPassport() {
    var v = visitedSites();
    var n = v.length, total = SITES.length || 1;
    var pct = Math.round(n / total * 100);
    $("#ppVisited").textContent = n;
    $("#ppOf").textContent = t("pp_of", { n: total });
    $("#ppPercent").textContent = pct + "% " + t("pp_percent");
    $("#ppLevel").textContent = levelOf(n);
    var circ = 2 * Math.PI * 52;
    $("#ppRing").style.strokeDashoffset = String(circ * (1 - Math.min(1, n / total)));
    $("#ppEmpty").hidden = n > 0;

    $("#ppBadges").innerHTML = BADGES.map(function (b) {
      var on = b.test(v);
      return '<div class="badge' + (on ? " on" : "") + '"><b>' + esc(t(b.name)) + "</b><span>" + esc(t(b.desc)) + "</span></div>";
    }).join("");

    $("#ppQuests").innerHTML = QUESTS.map(function (q) {
      var on = q.done(v);
      return '<div class="quest' + (on ? " done" : "") + '"><span>' + esc(t(q.text)) + "</span><b>" + esc(on ? t("quest_done") : "—") + "</b></div>";
    }).join("");

    var byCont = {}, byCat = {};
    ["Asia", "Europe", "Africa", "North America", "South America", "Oceania"].forEach(function (c) {
      var all = SITES.filter(function (s) { return s.continent === c; });
      if (!all.length) return;
      byCont[contLabel(c)] = [v.filter(function (s) { return s.continent === c; }).length, all.length];
    });
    ["archaeology", "heritage", "museum", "nature", "religious", "landmark", "food", "market", "craft", "science", "space"].forEach(function (c) {
      var all = SITES.filter(function (s) { return s.cat === c; });
      if (!all.length) return;
      byCat[catLabel(c)] = [v.filter(function (s) { return s.cat === c; }).length, all.length];
    });

    function bars(obj) {
      return Object.keys(obj).map(function (k) {
        var d = obj[k], p = d[1] ? Math.round(d[0] / d[1] * 100) : 0;
        return '<div class="bar-row"><span>' + esc(k) + '</span><span class="bar"><i style="width:' + p + '%"></i></span><span class="muted">' + d[0] + "/" + d[1] + "</span></div>";
      }).join("");
    }
    $("#ppByContinent").innerHTML = bars(byCont);
    $("#ppByCategory").innerHTML = bars(byCat);
  }

  /* ---------- trust ---------- */
  function renderTrust() {
    var seen = {}, html = [];
    SITES.forEach(function (s) {
      if (!s.source || !s.source.url) return;
      var key = s.source.url;
      if (seen[key]) return;
      seen[key] = 1;
      html.push('<div class="source-item"><a href="' + esc(s.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.source.title || s.source.url) + "</a><br><span class='muted tiny'>" + esc(s.source.publisher || "") + "</span></div>");
    });
    $("#trustSources").innerHTML = html.join("");
  }

  /* ---------- AI ---------- */
  function aiMessageHTML(m) {
    if (m.role === "user") return '<div class="msg user">' + esc(m.content) + "</div>";
    if (m.role === "error") return '<div class="msg err">' + esc(m.content) + "</div>";
    var src = "";
    if (m.sources && m.sources.length) {
      src = '<span class="src">' + esc(t("ai_sources")) + ": " + m.sources.map(function (x) {
        if (x.url && /^https?:\/\//i.test(x.url)) {
          return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title || x.url) + "</a>";
        }
        return esc(x.title || "");
      }).join(" · ") + "</span>";
    }
    if (m.confidence) src += '<span class="src">' + esc(t("ai_confidence")) + ": " + esc(m.confidence) + "</span>";
    return '<div class="msg bot">' + esc(m.content) + src + "</div>";
  }

  function ensureAiEmptyNode() {
    if (aiEmptyNode && document.body.contains(aiEmptyNode)) return aiEmptyNode;
    aiEmptyNode = document.createElement("div");
    aiEmptyNode.id = "aiEmpty";
    aiEmptyNode.className = "empty";
    aiEmptyNode.innerHTML = '<p>' + esc(t("ai_empty")) + "</p><p class='muted tiny'>" + esc(t("ai_empty_sub")) + "</p>";
    return aiEmptyNode;
  }

  function paintChat() {
    var box = $("#aiMsgs");
    if (!aiHistory.length) {
      box.innerHTML = "";
      var empty = ensureAiEmptyNode();
      empty.hidden = false;
      box.appendChild(empty);
      return;
    }
    box.innerHTML = aiHistory.map(aiMessageHTML).join("");
    box.scrollTop = box.scrollHeight;
  }

  function setAiSending(on) {
    var btn = $("#aiSend");
    if (btn) btn.disabled = !!on;
  }

  function sendAi(text) {
    text = (text || "").trim();
    if (!text) return;
    if (!AI.hasKey()) {
      aiHistory.push({ role: "user", content: text });
      aiHistory.push({ role: "error", content: t("ai_err_key") });
      paintChat();
      return;
    }
    aiHistory.push({ role: "user", content: text });
    paintChat();
    var langCode = lang();
    var langName = (window.I18n.langInfo(langCode) || { en: langCode }).en;
    var history = aiHistory.filter(function (m) { return m.role === "user" || m.role === "assistant"; }).slice(0, -1);
    var msgId = ++aiMsgSeq;
    aiHistory.push({ role: "assistant", content: t("ai_thinking"), pending: true, id: msgId });
    paintChat();
    setAiSending(true);
    AI.ask(text, history, langCode, langName).then(function (res) {
      var idx = -1;
      for (var i = 0; i < aiHistory.length; i++) {
        if (aiHistory[i].id === msgId) { idx = i; break; }
      }
      if (idx !== -1) {
        aiHistory[idx] = { role: "assistant", content: res.text, sources: res.sources, confidence: res.confidence };
      }
      paintChat();
      setAiSending(false);
    }).catch(function (e) {
      var idx = -1;
      for (var i = 0; i < aiHistory.length; i++) {
        if (aiHistory[i].id === msgId) { idx = i; break; }
      }
      if (idx !== -1) {
        aiHistory[idx] = { role: "error", content: t(e && e.key ? e.key : "ai_err_generic") };
      }
      paintChat();
      setAiSending(false);
    });
  }

  /* ---------- settings & language modal ---------- */
  function openLangModal() {
    var modal = $("#langModal");
    modal.hidden = false;
    $("#langSearch").value = "";
    paintLangGrid("");
    $("#langSearch").focus();
  }
  function paintLangGrid(q) {
    q = (q || "").toLowerCase();
    $("#langGrid").innerHTML = window.LANGS.filter(function (l) {
      return !q || l.native.toLowerCase().indexOf(q) !== -1 || l.en.toLowerCase().indexOf(q) !== -1 || l.code.indexOf(q) !== -1;
    }).map(function (l) {
      return '<button class="lang-opt' + (window.I18n.lang() === l.code ? " on" : "") + '" type="button" data-code="' + l.code + '"><b>' + esc(l.native) + "</b><span>" + esc(l.en) + "</span></button>";
    }).join("");
    $$("#langGrid .lang-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        window.I18n.setLang(b.getAttribute("data-code"));
        $("#langModal").hidden = true;
        refreshChrome();
        route();
      });
    });
  }
  function refreshChrome() {
    $("#langBtnLabel").textContent = window.I18n.nameOf(window.I18n.lang());
    $("#setLangLabel").textContent = window.I18n.nameOf(window.I18n.lang());
    $("#langMachineNote").textContent = t("lang_more");
  }

  function bindSettings() {
    $("#setLangBtn").addEventListener("click", openLangModal);
    $("#langBtn").addEventListener("click", openLangModal);
    $("#langClose").addEventListener("click", function () { $("#langModal").hidden = true; });
    $("#langSearch").addEventListener("input", function () { paintLangGrid(this.value); });
    $("#langModal").addEventListener("click", function (e) { if (e.target === this) this.hidden = true; });

    var keyInput = $("#keyInput");
    var stored = (window.Store && window.Store.get("key")) || (window.MORS_CONFIG && window.MORS_CONFIG.openaiKey) || "";
    keyInput.value = stored ? stored.slice(0, 7) + "…" + stored.slice(-4) : "";
    $("#keyStatus").textContent = stored ? t("ai_key_saved") : t("ai_key_hint");
    $("#keySave").addEventListener("click", function () {
      var v = keyInput.value.trim();
      if (v.indexOf("sk-") !== 0 || v.length < 20) { toast(t("ai_key_bad")); return; }
      window.Store.set("key", v);
      keyInput.value = v.slice(0, 7) + "…" + v.slice(-4);
      $("#keyStatus").textContent = t("ai_key_saved");
      toast(t("ai_key_saved"));
    });
    $("#keyRemove").addEventListener("click", function () {
      window.Store.set("key", "");
      keyInput.value = "";
      $("#keyStatus").textContent = t("ai_key_hint");
    });

    $$("#themeSeg button").forEach(function (b) {
      b.addEventListener("click", function () { setTheme(b.getAttribute("data-theme")); });
    });

    $("#speechTest").addEventListener("click", function () {
      if (!("speechSynthesis" in window)) return;
      var u = new SpeechSynthesisUtterance(t("st_speech_test"));
      u.lang = VOICE[lang()] || "en-US";
      speechSynthesis.speak(u);
    });

    $("#dataReset").addEventListener("click", function () {
      if (!confirm(t("st_reset_ask"))) return;
      window.Store.clearAll();
      toast(t("toast_reset"));
      route();
    });

    $("#trGo").addEventListener("click", doTranslate);
    $("#trInput").addEventListener("keydown", function (e) { if (e.key === "Enter") doTranslate(); });
  }

  function doTranslate() {
    var text = $("#trInput").value.trim();
    var to = $("#trLang").value;
    if (!text || !to) return;
    var out = $("#trOut");
    out.hidden = false;
    out.textContent = t("loading");
    window.I18n.translate(text, to).then(function (r) {
      out.innerHTML = '<b>' + esc(r) + '</b><br><span class="muted tiny">' + esc(t("lang_machine")) + "</span>";
    }).catch(function () {
      out.textContent = t("ai_err_network");
    });
  }

  function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    window.Store.set("theme", mode);
    $$("#themeSeg button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-theme") === mode); });
  }

  var VOICE = { en: "en-US", ar: "ar-SA", ku: "ku-IQ", fr: "fr-FR", es: "es-ES", tr: "tr-TR", fa: "fa-IR",
    de: "de-DE", zh: "zh-CN", ja: "ja-JP", hi: "hi-IN", id: "id-ID", ru: "ru-RU", pt: "pt-PT",
    it: "it-IT", ko: "ko-KR", ur: "ur-PK", hu: "hu-HU" };

  function speakDetail(s, btn) {
    if (!("speechSynthesis" in window)) return;
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.textContent = t("d_listen"); return; }
    var text = siteName(s) + ". " + siteSummary(s) + " " + siteSignificance(s);
    var u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE[lang()] || "en-US";
    u.rate = 0.95;
    btn.textContent = t("d_stop");
    u.onend = function () { btn.textContent = t("d_listen"); };
    speechSynthesis.speak(u);
  }

  /* ---------- boot ---------- */
  function bindGlobal() {
    window.addEventListener("hashchange", route);
    $("#burger").addEventListener("click", function () {
      var nav = $("#nav");
      var open = nav.classList.toggle("open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $("#expSearch").addEventListener("input", function () { filters.q = this.value; renderExplore(); });
    $("#fGov").addEventListener("change", function () { filters.gov = this.value; renderExplore(); });
    $("#fCountry").addEventListener("change", function () { filters.country = this.value; renderExplore(); });
    $("#fCategory").addEventListener("change", function () { filters.category = this.value; renderExplore(); });
    $("#fRegion").addEventListener("change", function () { filters.region = this.value; renderExplore(); });
    $("#fInterest").addEventListener("change", function () { filters.interest = this.value; renderExplore(); });
    $("#fSort").addEventListener("change", function () { filters.sort = this.value; if (filters.sort === "near") ensureUserPos(); renderExplore(); });
    $("#expWorld").addEventListener("click", function () {
      filters.world = !filters.world;
      filters.gov = ""; filters.country = ""; filters.region = ""; filters.category = ""; filters.interest = ""; filters.q = "";
      $("#expSearch").value = "";
      renderExplore();
    });
    $("#expView").addEventListener("click", function () { go("map"); });
    function clearFilters() {
      filters.q = ""; filters.gov = ""; filters.country = ""; filters.category = ""; filters.interest = ""; filters.region = ""; filters.sort = "rec";
      renderExplore();
    }
    $("#expClear").addEventListener("click", clearFilters);
    $("#expEmptyClear").addEventListener("click", clearFilters);

    $("#planGo").addEventListener("click", buildPlan);
    $("#planClear").addEventListener("click", function () {
      planState.gov = ""; planState.days = 3; planState.pace = "balanced"; planState.interests = {};
      $("#planOut").innerHTML = "";
      var gSel = $("#planGov");
      gSel.innerHTML = "";
      renderPlan();
    });

    $("#ppReset").addEventListener("click", function () {
      if (!confirm(t("pp_reset_ask"))) return;
      window.Store.visited.clear();
      renderPassport();
      toast(t("toast_reset"));
    });

    $("#aiForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("#aiInput").value;
      $("#aiInput").value = "";
      sendAi(v);
    });
    $("#aiClear").addEventListener("click", function () { aiHistory = []; paintChat(); });
    $$("#aiQuicks .chip").forEach(function (b) {
      b.addEventListener("click", function () { sendAi(t(b.getAttribute("data-quick"))); });
    });
    $("#aiVision").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) { toast(t("ai_err_generic")); this.value = ""; return; }
      var reader = new FileReader();
      reader.onload = function () {
        if (!AI.hasKey()) { aiHistory.push({ role: "error", content: t("ai_err_key") }); paintChat(); return; }
        aiHistory.push({ role: "user", content: t("ai_vision") + " (" + f.name + ")" });
        paintChat();
        var langCode = lang();
        var langName = (window.I18n.langInfo(langCode) || { en: langCode }).en;
        var msgId = ++aiMsgSeq;
        aiHistory.push({ role: "assistant", content: t("ai_thinking"), pending: true, id: msgId });
        paintChat();
        setAiSending(true);
        AI.vision(reader.result, t("ai_vision_hint"), langCode, langName).then(function (res) {
          var idx = -1;
          for (var i = 0; i < aiHistory.length; i++) {
            if (aiHistory[i].id === msgId) { idx = i; break; }
          }
          if (idx !== -1) {
            aiHistory[idx] = { role: "assistant", content: res.text, sources: [] };
          }
          paintChat();
          setAiSending(false);
        }).catch(function (e) {
          var idx = -1;
          for (var i = 0; i < aiHistory.length; i++) {
            if (aiHistory[i].id === msgId) { idx = i; break; }
          }
          if (idx !== -1) {
            aiHistory[idx] = { role: "error", content: t(e && e.key ? e.key : "ai_err_generic") };
          }
          paintChat();
          setAiSending(false);
        });
      };
      reader.readAsDataURL(f);
      this.value = "";
    });

    document.addEventListener("mors:lang", function () {
      filtersUiBuilt = false;
      planUiBuilt = false;
      route();
      refreshChrome();
    });
  }

  function init() {
    var q = null;
    try { var m = /[?&]lang=([a-zA-Z-]+)/.exec(location.search || ""); if (m) q = m[1].toLowerCase(); } catch (e) {}
    var preset = document.documentElement.lang && document.documentElement.lang !== "en" ? document.documentElement.lang : null;
    var start = q || window.Store.get("lang") || preset || window.I18n.detect();
    window.I18n.setLang(start, true);
    window.I18n.apply(document);
    refreshChrome();

    var theme = window.Store.get("theme") || "auto";
    setTheme(theme);

    // Point the MIKTUBATI links at the configured app URL (default localhost:3000).
    try {
      var mikUrl = (window.MORS_CONFIG && window.MORS_CONFIG.miktubatiUrl) || "http://localhost:3000";
      Array.prototype.forEach.call(document.querySelectorAll("[data-miktubati]"), function (a) {
        a.setAttribute("href", mikUrl);
      });
    } catch (e) {}

    var trSel = $("#trLang");
    var targets = window.LANGS.filter(function (l) { return l.code !== "en"; }).map(function (l) { return l.code; });
    var extra = ["ar", "fa", "ur", "hi", "he", "sw", "th", "vi", "ms", "bn", "ta", "te", "uk", "pl", "nl", "sv", "no", "da", "fi", "el", "cs", "ro", "bg", "sr", "sk", "sl", "hr", "az", "kk", "uz", "mn", "am", "ka", "hy", "is", "cy", "ga", "sq", "mk", "bs", "af", "ne", "si", "my", "km", "lo", "tl", "haw", "so", "rw", "yo", "ig", "ha", "zu", "xh", "st", "sn", "mg", "ps", "dv", "ckb", "yi", "la", "eo"];
    extra.forEach(function (c) { if (targets.indexOf(c) === -1) targets.push(c); });
    trSel.innerHTML = targets.map(function (c) {
      var info = window.I18n.langInfo(c);
      return '<option value="' + c + '">' + esc(info ? info.native : c) + "</option>";
    }).join("");

    bindGlobal();
    bindSettings();
    paintChat();

    // Header shadow on scroll
    var hdr = document.querySelector(".hdr");
    if (hdr) {
      var onScroll = function () { hdr.classList.toggle("scrolled", window.scrollY > 8); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    if (!location.hash) location.hash = "#/home";
    route();
  }

  return { init: init, toast: toast, go: go, route: route };
})();

document.addEventListener("DOMContentLoaded", function () { window.App.init(); });
