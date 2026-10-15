/* My Trip — client-side store (localStorage). The trip is personal planning
   data; it never leaves the device. */

export interface TripStop {
  id: string;
  name: string;
  gov?: string;
  lat?: number;
  lng?: number;
  addedAt: number;
}

const KEY = "athar_trip_v1";

export function loadTrip(): TripStop[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TripStop[];
    return Array.isArray(parsed) ? parsed.slice(0, 60) : [];
  } catch {
    return [];
  }
}

export function saveTrip(stops: TripStop[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stops.slice(0, 60)));
  } catch {
    // storage full / private mode — trip stays in memory for this page view
  }
}

export function tripContains(stops: TripStop[], id: string): boolean {
  return stops.some((s) => s.id === id);
}

export function tripText(stops: TripStop[]): string {
  return stops.map((s, i) => `${i + 1}. ${s.name}${s.gov ? ` — ${s.gov}` : ""}`).join("\n");
}
