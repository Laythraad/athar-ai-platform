"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { loadTrip, saveTrip, tripContains, type TripStop } from "@/lib/travel/trip";

/** Add/remove a place from the device-local trip list. */
export default function AddToTripButton({
  lang,
  stop,
}: {
  lang: Lang;
  stop: { id: string; name: string; gov?: string; lat?: number; lng?: number };
}) {
  const [inTrip, setInTrip] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage is an external system — hydrate after mount
    const raf = requestAnimationFrame(() => {
      setInTrip(tripContains(loadTrip(), stop.id));
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [stop.id]);

  if (!ready) return <span className="pill tiny muted">…</span>;

  function toggle() {
    const trip = loadTrip();
    if (tripContains(trip, stop.id)) {
      saveTrip(trip.filter((s) => s.id !== stop.id));
      setInTrip(false);
    } else {
      const next: TripStop[] = [
        ...trip,
        { id: stop.id, name: stop.name, gov: stop.gov, lat: stop.lat, lng: stop.lng, addedAt: Date.now() },
      ];
      saveTrip(next);
      setInTrip(true);
    }
  }

  return (
    <button type="button" className={`btn btn-sm ${inTrip ? "btn-primary" : "btn-ghost"}`} onClick={toggle}>
      {inTrip ? `✓ ${t(lang, "her_trip_added")}` : `＋ ${t(lang, "trip_add")}`}
    </button>
  );
}
