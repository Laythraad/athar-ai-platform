/** Lightweight loading skeleton shown while a route streams. */
export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      <div className="card" style={{ height: "3rem", opacity: 0.6 }} />
      <div className="grid-cards">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card" style={{ height: "11rem", opacity: 0.5 }} />
        ))}
      </div>
    </div>
  );
}
