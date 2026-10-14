/* MORS HERITAGE — i18n runtime: 18 core languages + machine translation to any. */
window.LANGS = [
  { code: "en", native: "English",        en: "English",          dir: "ltr" },
  { code: "ar", native: "العربية",         en: "Arabic",           dir: "rtl" },
  { code: "ku", native: "کوردی (سۆرانی)",  en: "Kurdish (Sorani)", dir: "rtl" },
  { code: "fr", native: "Français",        en: "French",           dir: "ltr" },
  { code: "es", native: "Español",         en: "Spanish",          dir: "ltr" },
  { code: "tr", native: "Türkçe",          en: "Turkish",          dir: "ltr" },
  { code: "fa", native: "فارسی",           en: "Persian",          dir: "rtl" },
  { code: "de", native: "Deutsch",         en: "German",           dir: "ltr" },
  { code: "zh", native: "中文",             en: "Chinese",          dir: "ltr" },
  { code: "ja", native: "日本語",           en: "Japanese",         dir: "ltr" },
  { code: "hi", native: "हिन्दी",           en: "Hindi",            dir: "ltr" },
  { code: "id", native: "Bahasa Indonesia",en: "Indonesian",       dir: "ltr" },
  { code: "ru", native: "Русский",         en: "Russian",          dir: "ltr" },
  { code: "pt", native: "Português",       en: "Portuguese",       dir: "ltr" },
  { code: "it", native: "Italiano",        en: "Italian",          dir: "ltr" },
  { code: "ko", native: "한국어",           en: "Korean",           dir: "ltr" },
  { code: "ur", native: "اردو",            en: "Urdu",             dir: "rtl" },
  { code: "hu", native: "Magyar",          en: "Hungarian",        dir: "ltr" }
];

window.I18n = (function () {
  var I = window.MORS_I18N || {};
  var current = "en";
  var transCache = {};

  function langInfo(code) {
    for (var i = 0; i < window.LANGS.length; i++) {
      if (window.LANGS[i].code === code) return window.LANGS[i];
    }
    return null;
  }

  function dict(code) { return I[code] || I.en || {}; }

  function t(key, params) {
    var s = dict(current)[key];
    if (s == null) s = (I.en && I.en[key] != null) ? I.en[key] : key;
    if (params) {
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) {
          s = String(s).split("{" + k + "}").join(params[k]);
        }
      }
    }
    return s;
  }

  function nameOf(code) {
    var info = langInfo(code);
    return info ? info.native : code;
  }

  function isCore(code) { return !!langInfo(code); }

  function apply(root) {
    root = root || document;
    var nodes = root.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    var ph = root.querySelectorAll("[data-i18n-ph]");
    for (var j = 0; j < ph.length; j++) ph[j].setAttribute("placeholder", t(ph[j].getAttribute("data-i18n-ph")));
    var tt = root.querySelectorAll("[data-i18n-title]");
    for (var m = 0; m < tt.length; m++) tt[m].setAttribute("title", t(tt[m].getAttribute("data-i18n-title")));
    document.documentElement.lang = current;
    var info = langInfo(current);
    document.documentElement.dir = info ? info.dir : "ltr";
  }

  function detect() {
    var q = null;
    try {
      var m = /[?&]lang=([a-zA-Z-]+)/.exec(window.location.search || "");
      if (m) q = m[1].toLowerCase();
    } catch (e) { /* ignore */ }
    if (q) {
      if (isCore(q)) return q;
      var base = q.split("-")[0];
      if (isCore(base)) return base;
      return q; // machine-translated target language
    }
    var saved = window.Store && window.Store.get("lang");
    if (saved) return saved;
    try {
      var nav = (navigator.language || "en").toLowerCase();
      if (isCore(nav)) return nav;
      var b = nav.split("-")[0];
      if (isCore(b)) return b;
    } catch (e) { /* ignore */ }
    return "en";
  }

  function setLang(code, silent) {
    current = code;
    if (window.Store) window.Store.set("lang", code);
    apply(document);
    document.dispatchEvent(new CustomEvent("mors:lang", { detail: { code: code } }));
    if (!silent && window.App && window.App.toast) {
      window.App.toast(t("toast_lang", { name: nameOf(code) }));
    }
  }

  /* Machine translation via the free Google endpoint, MyMemory as fallback. */
  function translate(text, target) {
    var cacheKey = target + "::" + text;
    if (transCache[cacheKey]) return Promise.resolve(transCache[cacheKey]);
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
      encodeURIComponent(target) + "&dt=t&q=" + encodeURIComponent(text);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("gtx " + r.status);
      return r.json();
    }).then(function (j) {
      var out = "";
      if (j && j[0]) {
        for (var i = 0; i < j[0].length; i++) {
          if (j[0][i] && j[0][i][0]) out += j[0][i][0];
        }
      }
      if (!out) throw new Error("empty");
      transCache[cacheKey] = out;
      return out;
    }).catch(function () {
      var url2 = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) +
        "&langpair=en|" + encodeURIComponent(target);
      return fetch(url2).then(function (r) { return r.json(); }).then(function (j) {
        var out = j && j.responseData && j.responseData.translatedText;
        if (!out) throw new Error("mymemory empty");
        transCache[cacheKey] = out;
        return out;
      });
    });
  }

  return {
    t: t, apply: apply, setLang: setLang, detect: detect,
    lang: function () { return current; },
    nameOf: nameOf, isCore: isCore, langInfo: langInfo, translate: translate
  };
})();
