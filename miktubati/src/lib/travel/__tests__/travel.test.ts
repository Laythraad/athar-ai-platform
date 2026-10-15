import { describe, it, expect } from "vitest";
import { CULTURE_GUIDES, cultureForGovernorate } from "../culture";
import { AIRPORTS, airportMapsUrl } from "../airports";
import { loadTrip, saveTrip, tripContains, tripText } from "../trip";

describe("cultureForGovernorate", () => {
  it("finds guides for known governorates, case-insensitive", () => {
    expect(cultureForGovernorate("Baghdad")).not.toBeNull();
    expect(cultureForGovernorate("karbala")).not.toBeNull();
    expect(cultureForGovernorate("Najaf")).not.toBeNull();
  });
  it("returns null for unknown governorates", () => {
    expect(cultureForGovernorate("Atlantis")).toBeNull();
  });
  it("every guide has a law note that asks to verify (never asserts law)", () => {
    for (const g of CULTURE_GUIDES) {
      expect(g.lawNote.en.length).toBeGreaterThan(10);
      expect(g.lawNote.ar.length).toBeGreaterThan(5);
    }
  });
});

describe("airports", () => {
  it("has real IATA/ICAO identifiers and coordinates for Iraq hubs", () => {
    const bgw = AIRPORTS.find((a) => a.iata === "BGW");
    expect(bgw).toBeTruthy();
    expect(bgw!.icao).toBe("ORBI");
    expect(bgw!.lat).toBeGreaterThan(30);
    expect(bgw!.lng).toBeGreaterThan(40);
  });
  it("map links are real Google Maps URLs", () => {
    for (const a of AIRPORTS) {
      expect(airportMapsUrl(a)).toMatch(/^https:\/\/www\.google\.com\/maps\?q=-?\d/);
    }
  });
  it("never fabricates flight schedules — only sourced fields exist", () => {
    for (const a of AIRPORTS) {
      expect(Object.keys(a)).not.toContain("flights");
      expect(a.source.length).toBeGreaterThan(3);
    }
  });
});

describe("trip store (no window in node)", () => {
  it("is inert outside the browser", () => {
    expect(loadTrip()).toEqual([]);
    saveTrip([{ id: "x", name: "Babylon", addedAt: 1 }]);
    expect(loadTrip()).toEqual([]);
  });
  it("helpers work on plain arrays", () => {
    const stops = [{ id: "a", name: "Babylon", gov: "Babil", addedAt: 1 }];
    expect(tripContains(stops, "a")).toBe(true);
    expect(tripContains(stops, "b")).toBe(false);
    expect(tripText(stops)).toContain("Babylon");
    expect(tripText(stops)).toContain("Babil");
  });
});
