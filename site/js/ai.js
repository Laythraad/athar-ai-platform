/* ATHAR IRAQ — AI guide: RAG over Iraq atlas chunks, cited answers, offline fallback. */
window.AI = (function () {
  var MODEL = "gpt-4o-mini";
  var ENDPOINT = "https://api.openai.com/v1/chat/completions";
  var TOP_K = 8;
  var chunks = null;
  var idf = null;

  function key() {
    if (window.Store && window.Store.get("key")) return window.Store.get("key");
    if (window.MORS_CONFIG && window.MORS_CONFIG.openaiKey) return window.MORS_CONFIG.openaiKey;
    return null;
  }
  function hasKey() { return !!key(); }

  /* ---------- knowledge chunks ---------- */
  function buildChunks() {
    if (chunks) return chunks;
    var sites = (window.SITES || []).filter(function (s) {
      // Iraq sites + space/science/museum sites (global)
      if (s.country && s.country.iso === "IQ") return true;
      if (s.cat === "space" || s.cat === "science") return true;
      // Space museums (e.g. Smithsonian)
      if (s.cat === "museum" && s.tags && s.tags.some(function (t) {
        return /space|astronomy|rocket|NASA/i.test(t);
      })) return true;
      return false;
    });
    chunks = [];
    sites.forEach(function (s) {
      var base = {
        siteId: s.id,
        nameEn: s.name && s.name.en || "",
        nameAr: s.name && s.name.ar || "",
        govEn: s.governorate && s.governorate.en || "",
        govAr: s.governorate && s.governorate.ar || "",
        cat: s.cat,
        eraEn: s.era && s.era.en || "",
        precision: s.precision,
        lat: s.lat, lng: s.lng,
        visitMinutes: s.visit,
        source: s.source ? { title: s.source.title, publisher: s.source.publisher, url: s.source.url } : null,
        lastVerified: s.lastVerifiedAt || null,
        hours: s.openingHours === null || s.openingHours === undefined ? null : s.openingHours,
        cost: s.visitCost === null || s.visitCost === undefined ? null : s.visitCost
      };
      if (s.summary && s.summary.en) {
        chunks.push(extend(base, {
          chunkId: s.id + "#summary",
          text: s.summary.en,
          textAr: s.summary.ar || "",
          kind: "summary"
        }));
      }
      if (s.significance && s.significance.en) {
        chunks.push(extend(base, {
          chunkId: s.id + "#significance",
          text: s.significance.en,
          textAr: s.significance.ar || "",
          kind: "significance"
        }));
      }
      (s.facts || []).forEach(function (f, i) {
        if (!f || !f.en) return;
        chunks.push(extend(base, {
          chunkId: s.id + "#fact" + i,
          text: f.en,
          textAr: f.ar || "",
          kind: "fact"
        }));
      });
    });
    buildIdf();
    return chunks;
  }
  function extend(a, b) {
    var o = {};
    for (var k in a) o[k] = a[k];
    for (var k2 in b) o[k2] = b[k2];
    return o;
  }

  var STOP = { a:1, an:1, the:1, and:1, or:1, of:1, in:1, on:1, to:1, for:1, my:1, me:1,
    what:1, where:1, when:1, who:1, why:1, how:1, is:1, are:1, was:1, were:1, do:1,
    does:1, did:1, about:1, with:1, from:1, at:1, by:1, it:1, its:1, this:1, that:1,
    tell:1, give:1, can:1, could:1, you:1, i:1, please:1, me:1, about:1, site:1,
    place:1, heritage:1, iraq:1, sites:1, places:1 };

  function tokenize(text) {
    return String(text || "").toLowerCase().split(/[^a-z0-9\u0600-\u06FF]+/).filter(function (w) {
      return w.length > 1 && !STOP[w];
    });
  }

  function buildIdf() {
    idf = {};
    var N = chunks.length;
    var df = {};
    chunks.forEach(function (c) {
      var seen = {};
      tokenize(c.text + " " + c.textAr + " " + c.nameEn + " " + c.nameAr + " " + c.govEn + " " + c.cat + " " + c.eraEn).forEach(function (w) {
        if (!seen[w]) { df[w] = (df[w] || 0) + 1; seen[w] = 1; }
      });
    });
    Object.keys(df).forEach(function (w) {
      idf[w] = Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5));
    });
  }

  /* ---------- BM25-lite retrieval ---------- */
  function retrieve(query, k) {
    var all = buildChunks();
    var qToks = tokenize(query);
    if (!qToks.length) return [];
    var k1 = 1.5, b = 0.75;
    var avgLen = 0;
    all.forEach(function (c) { avgLen += c.text.length; });
    avgLen = avgLen / (all.length || 1);

    var scored = all.map(function (c) {
      var doc = c.text + " " + c.textAr + " " + c.nameEn + " " + c.nameAr + " " + c.govEn + " " + c.govAr + " " + c.cat + " " + c.eraEn;
      var dToks = tokenize(doc);
      var tf = {};
      dToks.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
      var score = 0;
      var matched = 0;
      qToks.forEach(function (w) {
        if (!tf[w]) return;
        matched++;
        var idfV = idf[w] || Math.log(1 + all.length / 1);
        var f = tf[w];
        var denom = f + k1 * (1 - b + b * dToks.length / (avgLen || 1));
        score += idfV * (f * (k1 + 1)) / denom;
      });
      /* boost name/gov exact hits */
      var qLower = query.toLowerCase();
      if (c.nameEn && qLower.indexOf(c.nameEn.toLowerCase()) !== -1) score += 3;
      if (c.nameAr && query.indexOf(c.nameAr) !== -1) score += 3;
      if (c.govEn && qLower.indexOf(c.govEn.toLowerCase()) !== -1) score += 1.5;
      if (c.govAr && query.indexOf(c.govAr) !== -1) score += 1.5;
      return { chunk: c, score: score, matched: matched };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored.filter(function (x) { return x.score > 0 && x.matched > 0; }).slice(0, k || TOP_K);
    return top;
  }

  /* ---------- confidence ---------- */
  function confidenceFrom(hits) {
    if (!hits.length) return "none";
    var total = 0, topScore = hits[0].score;
    hits.forEach(function (h) { total += h.score; });
    if (topScore >= 8 && hits[0].matched >= 3) return "high";
    if (topScore >= 4 || hits.length >= 4) return "medium";
    if (topScore >= 1.5) return "low";
    return "low";
  }

  /* ---------- offline fallback (no key / network fail) ---------- */
  function offlineAnswer(question, hits, langCode) {
    if (!hits.length) {
      var msg = langCode === "ar"
        ? "لا توجد معلومات مطابقة في قاعدة المعرفة العراقية. جرّب سؤالًا آخر عن موقع تراثي عراقي."
        : langCode === "ku"
        ? "هیچ زانیارییەکی وەکەوە لە بنکەی زانیاری عێراقدا نییە. تاقیکردنەوەی پرسیارێکی تر دەکەوێت."
        : "No matching information in the Iraq knowledge base. Try a different question about an Iraqi heritage site.";
      return { text: msg, sources: [], confidence: "none", offline: true };
    }
    var lines = [];
    var seen = {};
    hits.forEach(function (h) {
      var c = h.chunk;
      if (seen[c.siteId]) return;
      seen[c.siteId] = 1;
      var name = langCode === "ar" || langCode === "fa" || langCode === "ur" ? c.nameAr : c.nameEn;
      var text = langCode === "ar" || langCode === "fa" || langCode === "ur" ? (c.textAr || c.text) : c.text;
      lines.push("• " + name + " (" + (c.govEn || c.govAr) + ", " + c.cat + "): " + text);
    });
    var prefix = langCode === "ar"
      ? "نتائج من قاعدة المعرفة (بدون ذكاء اصطناعي — وضع عدم الاتصال):\n\n"
      : langCode === "ku"
      ? "ئەنجامەکانی بنکەی زانیاری (بێ زیرەکی دەستکرد — دۆخی نەبەردەست):\n\n"
      : "Knowledge base results (no AI used — offline mode):\n\n";
    var sources = hits.slice(0, 5).map(function (h) {
      return { title: h.chunk.source && h.chunk.source.title || h.chunk.nameEn, url: h.chunk.source && h.chunk.source.url || "" };
    });
    return {
      text: prefix + lines.join("\n"),
      sources: sources,
      confidence: confidenceFrom(hits),
      offline: true
    };
  }

  /* ---------- OpenAI with strict JSON ---------- */
  function systemPrompt(langCode, langName) {
    return "You are ATHAR IRAQ, the cited heritage guide inside a static website shown to the user. " +
      "Answer in " + langName + " (language code " + langCode + ").\n\n" +
      "You receive retrieved knowledge chunks (JSON) from the Iraq heritage atlas. " +
      "Ground your answer ONLY in these chunks. When you use a fact, name the place and cite its source.\n\n" +
      "STRICT OUTPUT FORMAT — return ONLY a JSON object, no markdown, no extra text:\n" +
      '{"answer": "your answer here", "citations": [{"chunkId": "...", "source": "publisher", "url": "..."}], "confidence": "high|medium|low|none"}\n\n' +
      "Rules:\n" +
      "- answer: concise, structured paragraphs; no markdown tables.\n" +
      "- citations: list every chunk you actually used; include chunkId, source publisher, and url when available.\n" +
      "- confidence: high = 2+ strong chunk matches; medium = partial match; low = weak match; none = no relevant chunks.\n" +
      "- If chunks do not cover the question, set confidence to \"none\" and say so plainly in answer — do NOT invent sites, dates, statistics, or citations.\n" +
      "- For itineraries use visit_minutes; say when opening times or fees are unknown.\n" +
      "- For general knowledge not in the chunks, mark it as general knowledge in the answer.";
  }

  function chunkPayload(hits, langCode) {
    return hits.map(function (h) {
      var c = h.chunk;
      return {
        chunkId: c.chunkId,
        siteId: c.siteId,
        name_en: c.nameEn,
        name_ar: c.nameAr,
        governorate_en: c.govEn,
        governorate_ar: c.govAr,
        category: c.cat,
        era_en: c.eraEn,
        precision: c.precision,
        visit_minutes: c.visitMinutes,
        kind: c.kind,
        text_en: c.text,
        text_ar: c.textAr,
        source: c.source ? { title: c.source.title, publisher: c.source.publisher, url: c.source.url } : null,
        last_verified: c.lastVerified,
        opening_hours: c.hours,
        visit_cost: c.cost
      };
    });
  }

  function mapError(status, body) {
    var code = "";
    try { code = (JSON.parse(body).error && JSON.parse(body).error.code) || ""; } catch (e) {}
    if (status === 401 || /invalid_api_key|incorrect/i.test(body || "")) return { key: "ai_err_key" };
    if (status === 429 && (/insufficient_quota|credit_balance/i.test(body || "") || code === "insufficient_quota")) return { key: "ai_err_quota" };
    if (status === 429) return { key: "ai_err_network" };
    return { key: "ai_err_generic", detail: (body || "").slice(0, 300) };
  }

  function chat(payload) {
    var k = key();
    if (!k) return Promise.reject({ key: "ai_err_key" });
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Authorization": "Bearer " + k, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.text().then(function (text) {
        if (!r.ok) {
          var err = mapError(r.status, text);
          err.status = r.status;
          throw err;
        }
        var j = JSON.parse(text);
        return j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : "";
      });
    }).catch(function (e) {
      if (e && e.key) throw e;
      throw { key: "ai_err_network" };
    });
  }

  function parseStrictJSON(raw) {
    var s = String(raw || "").trim();
    s = s.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
    var start = s.indexOf("{"), end = s.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    try { return JSON.parse(s.slice(start, end + 1)); } catch (e) { return null; }
  }

  function ask(question, history, langCode, langName) {
    var hits = retrieve(question, TOP_K);
    if (!hasKey()) {
      return Promise.resolve(offlineAnswer(question, hits, langCode));
    }
    var ctx = chunkPayload(hits, langCode);
    var msgs = [{ role: "system", content: systemPrompt(langCode, langName) }];
    msgs.push({ role: "system", content: "Retrieved knowledge chunks (JSON):\n" + JSON.stringify(ctx) });
    if (history && history.length) {
      for (var i = 0; i < history.length; i++) {
        msgs.push({ role: history[i].role, content: history[i].content });
      }
    }
    msgs.push({ role: "user", content: question });
    return chat({ model: MODEL, messages: msgs, temperature: 0.2, max_tokens: 800, response_format: { type: "json_object" } })
      .then(function (raw) {
        var j = parseStrictJSON(raw);
        if (j && typeof j.answer === "string") {
          var cites = (j.citations || []).map(function (c) {
            return {
              chunkId: c.chunkId || "",
              title: c.source || c.chunkId || "",
              url: c.url || ""
            };
          });
          var conf = j.confidence || confidenceFrom(hits);
          if (conf !== "high" && conf !== "medium" && conf !== "low" && conf !== "none") conf = confidenceFrom(hits);
          return { text: j.answer, sources: cites, confidence: conf, offline: false };
        }
        /* unparseable — salvage plain text but still attach chunk sources */
        var sources = hits.slice(0, 3).map(function (h) {
          return { title: h.chunk.source && h.chunk.source.title || h.chunk.nameEn, url: h.chunk.source && h.chunk.source.url || "" };
        });
        return { text: raw, sources: sources, confidence: confidenceFrom(hits), offline: false };
      })
      .catch(function (e) {
        if (e && (e.key === "ai_err_quota" || e.key === "ai_err_network" || e.key === "ai_err_key")) {
          if (e.key === "ai_err_key") throw e;
          /* quota/network → honest offline fallback from retrieved chunks */
          var fb = offlineAnswer(question, hits, langCode);
          fb.errorKey = e.key;
          return fb;
        }
        throw e;
      });
  }

  function vision(dataUrl, prompt, langCode, langName) {
    var k = key();
    if (!k) return Promise.reject({ key: "ai_err_key" });
    return chat({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.2,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: (prompt || "Describe this photo.") + " Answer in " + langName + ". If it shows an Iraqi heritage site, name it and cite the atlas source if known; otherwise say it is general knowledge." },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }]
    }).then(function (text) { return { text: text, sources: [], confidence: "low" }; });
  }

  return { ask: ask, vision: vision, hasKey: hasKey, key: key, retrieve: retrieve, MODEL: MODEL };
})();
