// Framework-free unit tests for the pure geo/parse helpers.
// Run: npx tsx src/app/[locale]/n/app/mobile/map-discovery/nearby.geo.test.ts
import assert from "node:assert/strict";

import {
  normalizeDigits,
  parseCoordinate,
  haversineKm,
  sortByDistance,
  selectNearby,
} from "./nearby.geo";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${name}`);
}

// --- normalizeDigits ---
test("normalizeDigits converts Persian digits", () => {
  assert.equal(normalizeDigits("۳۵٫۶۸"), "35.68");
});
test("normalizeDigits converts Arabic-Indic digits", () => {
  assert.equal(normalizeDigits("٥١٫٣٩"), "51.39");
});
test("normalizeDigits leaves ASCII untouched", () => {
  assert.equal(normalizeDigits("35.689"), "35.689");
});

// --- parseCoordinate ---
test("parseCoordinate parses a normal latitude", () => {
  assert.equal(parseCoordinate("35.6892", -90, 90), 35.6892);
});
test("parseCoordinate parses Persian-digit coordinate", () => {
  assert.equal(parseCoordinate("۵۱٫۳۸۹۰", -180, 180), 51.389);
});
test("parseCoordinate rejects out-of-range", () => {
  assert.equal(parseCoordinate("200", -90, 90), null);
});
test("parseCoordinate rejects garbage / empty", () => {
  assert.equal(parseCoordinate("abc", -90, 90), null);
  assert.equal(parseCoordinate("", -90, 90), null);
  assert.equal(parseCoordinate(null, -90, 90), null);
});

// --- haversineKm ---
test("haversineKm is 0 for identical points", () => {
  assert.equal(haversineKm(35.6892, 51.389, 35.6892, 51.389), 0);
});
test("haversineKm Tehran→Istanbul is ~2000km (not euclidean)", () => {
  const d = haversineKm(35.6892, 51.389, 41.0082, 28.9784);
  assert.ok(Math.abs(d - 1990) < 60, `expected ~1990km, got ${d.toFixed(1)}`);
});
test("haversineKm Tehran→Karaj is ~40km (short distance accurate)", () => {
  const d = haversineKm(35.6892, 51.389, 35.84, 50.9391);
  assert.ok(d > 35 && d < 50, `expected ~40km, got ${d.toFixed(1)}`);
});

// --- sortByDistance ---
test("sortByDistance orders nearest-first, nulls last", () => {
  const user = { lat: 35.6892, lng: 51.389 };
  const items = [
    { id: "istanbul", latitude: 41.0082, longitude: 28.9784 },
    { id: "no-coords", latitude: null, longitude: null },
    { id: "karaj", latitude: 35.84, longitude: 50.9391 },
    { id: "tehran", latitude: 35.69, longitude: 51.39 },
  ];
  const sorted = sortByDistance(items, user.lat, user.lng);
  assert.deepEqual(
    sorted.map((x) => x.id),
    ["tehran", "karaj", "istanbul", "no-coords"],
  );
  assert.ok((sorted[0].distanceKm ?? 99) < 1); // tehran ~0km
});

// --- selectNearby (expanding radius) ---
test("selectNearby returns within-radius when available", () => {
  const items = [
    { id: "tehran", latitude: 35.69, longitude: 51.39 },
    { id: "istanbul", latitude: 41.0082, longitude: 28.9784 },
  ];
  const { results, expanded } = selectNearby(items, 35.6892, 51.389, 50);
  assert.equal(expanded, false);
  assert.deepEqual(results.map((x) => x.id), ["tehran"]); // istanbul beyond 50km excluded
});
test("selectNearby EXPANDS across countries when radius is empty", () => {
  // User in a remote spot with no provider within 50km → must still return the
  // nearest available, sorted by distance, instead of an empty list.
  const items = [
    { id: "istanbul", latitude: 41.0082, longitude: 28.9784 },
    { id: "dubai", latitude: 25.2048, longitude: 55.2708 },
  ];
  const { results, expanded } = selectNearby(items, 35.6892, 51.389, 50);
  assert.equal(expanded, true);
  assert.equal(results.length, 2);
  assert.equal(results[0].id, "dubai"); // dubai is nearer to Tehran than istanbul
  assert.ok((results[0].distanceKm ?? 0) < (results[1].distanceKm ?? 0));
});
test("selectNearby with no radius just sorts by distance", () => {
  const items = [
    { id: "istanbul", latitude: 41.0082, longitude: 28.9784 },
    { id: "tehran", latitude: 35.69, longitude: 51.39 },
  ];
  const { results, expanded } = selectNearby(items, 35.6892, 51.389, null);
  assert.equal(expanded, false);
  assert.deepEqual(results.map((x) => x.id), ["tehran", "istanbul"]);
});

// eslint-disable-next-line no-console
console.log(`\n${passed} tests passed.`);
