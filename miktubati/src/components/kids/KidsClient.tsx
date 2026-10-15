"use client";

/* ATHAR Kids — interactive stories + quizzes. Client-only state; no personal
   data is collected and nothing is uploaded. The kids AI endpoint refuses
   off-topic or unsafe requests by design (strict system prompt server-side). */

import { useState } from "react";
import { t, bl, type Lang } from "@/lib/i18n";
import { KIDS_STORIES, KIDS_QUIZZES, type KidsStory, type KidsQuiz } from "@/lib/kids/content";

export default function KidsClient({ lang }: { lang: Lang }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [aiQ, setAiQ] = useState("");
  const [aiOut, setAiOut] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  const score = (items: (KidsStory | KidsQuiz)[]) =>
    items.filter((it) => answers[it.id] === it.answerIndex).length;

  async function askKidsAi() {
    const q = aiQ.trim();
    if (!q) return;
    setAiBusy(true);
    setAiErr(null);
    setAiOut(null);
    try {
      const res = await fetch("/api/kids-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, lang }),
      });
      const data = (await res.json()) as { ok?: boolean; answer?: string; errorKey?: string };
      if (data.ok && data.answer) setAiOut(data.answer);
      else setAiErr(data.errorKey === "kids_topic_blocked" ? t(lang, "kids_blocked") : t(lang, "common_error"));
    } catch {
      setAiErr(t(lang, "common_error"));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="stack">
      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "kids_parent_note")}
      </p>

      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t(lang, "kids_stories")}</h2>
      {KIDS_STORIES.map((s) => (
        <StoryCard key={s.id} story={s} lang={lang} picked={answers[s.id]} onPick={(i) => setAnswers((a) => ({ ...a, [s.id]: i }))} />
      ))}

      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>
        {t(lang, "kids_quiz")} · {t(lang, "kids_score")}: {score(KIDS_QUIZZES)}/{KIDS_QUIZZES.length}
      </h2>
      {KIDS_QUIZZES.map((q) => (
        <QuizCard key={q.id} quiz={q} lang={lang} picked={answers[q.id]} onPick={(i) => setAnswers((a) => ({ ...a, [q.id]: i }))} />
      ))}

      <div className="card stack" style={{ gap: "0.5rem" }}>
        <strong>{t(lang, "kids_ai_title")}</strong>
        <p className="tiny muted" style={{ margin: 0 }}>
          {t(lang, "kids_ai_note")}
        </p>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void askKidsAi();
          }}
        >
          <input
            className="input"
            style={{ flex: "1 1 200px" }}
            value={aiQ}
            onChange={(e) => setAiQ(e.target.value)}
            placeholder={t(lang, "kids_ai_ph")}
            aria-label={t(lang, "kids_ai_title")}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={aiBusy}>
            {t(lang, "her_ask_send")}
          </button>
        </form>
        {aiBusy && <p className="muted tiny" style={{ margin: 0 }}>{t(lang, "ai_thinking")}</p>}
        {aiOut && <div className="prose">{aiOut}</div>}
        {aiErr && (
          <p className="field-err" style={{ margin: 0 }} role="alert">
            {aiErr}
          </p>
        )}
      </div>
    </div>
  );
}

function StoryCard({
  story,
  lang,
  picked,
  onPick,
}: {
  story: KidsStory;
  lang: Lang;
  picked?: number;
  onPick: (i: number) => void;
}) {
  const answered = picked !== undefined;
  return (
    <div className="card stack" style={{ gap: "0.5rem" }}>
      <div className="row-between">
        <strong>{bl(lang, story.title)}</strong>
        <span className="pill tiny">{story.ageRange}</span>
      </div>
      <p style={{ margin: 0 }}>{bl(lang, story.text)}</p>
      <p style={{ margin: 0 }}>
        <strong>{bl(lang, story.question)}</strong>
      </p>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {(lang === "ar" ? story.choices.ar : story.choices.en).map((c, i) => (
          <button
            key={i}
            type="button"
            className={`pill${answered && i === story.answerIndex ? " pill-published" : ""}${answered && i === picked && i !== story.answerIndex ? " pill-rejected" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onPick(i)}
          >
            {c}
          </button>
        ))}
      </div>
      {answered && <p className="tiny muted" style={{ margin: 0 }}>{story.source}</p>}
    </div>
  );
}

function QuizCard({
  quiz,
  lang,
  picked,
  onPick,
}: {
  quiz: KidsQuiz;
  lang: Lang;
  picked?: number;
  onPick: (i: number) => void;
}) {
  const answered = picked !== undefined;
  return (
    <div className="card stack" style={{ gap: "0.5rem" }}>
      <p style={{ margin: 0 }}>
        <strong>{bl(lang, quiz.question)}</strong>
      </p>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {(lang === "ar" ? quiz.choices.ar : quiz.choices.en).map((c, i) => (
          <button
            key={i}
            type="button"
            className={`pill${answered && i === quiz.answerIndex ? " pill-published" : ""}${answered && i === picked && i !== quiz.answerIndex ? " pill-rejected" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onPick(i)}
          >
            {c}
          </button>
        ))}
      </div>
      {answered && <p className="tiny muted" style={{ margin: 0 }}>{quiz.source}</p>}
    </div>
  );
}
