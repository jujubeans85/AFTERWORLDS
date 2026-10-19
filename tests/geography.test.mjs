import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { decodeTopology, unwrapRing } from "../src/math.js";

const topology = JSON.parse(
  fs.readFileSync(
    new URL("../vendor/countries-110m.json", import.meta.url),
    "utf8",
  ),
);
const countries = decodeTopology(topology);

// Independent even-odd point classification. These checks do not use Canvas,
// Three.js, the renderer's pixel mask, or the renderer's sample locations.
function containsPoint(ring, longitude, latitude) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crossesLatitude = yi > latitude !== yj > latitude;
    if (
      crossesLatitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function placesAt(longitude, latitude, correctDateline = true) {
  return countries
    .filter((country) =>
      country.polygons.some((polygon) =>
        [-360, 0, 360].some((shift) =>
          polygon.reduce(
            (inside, ring) =>
              inside !==
              containsPoint(
                correctDateline ? unwrapRing(ring) : ring,
                longitude - shift,
                latitude,
              ),
            false,
          ),
        ),
      ),
    )
    .map((country) => country.name);
}

test("Fiji does not extend across the Pacific or South Atlantic", () => {
  // These ocean coordinates exposed a real bug in the original flat polygon
  // fill. Retain the before/after evidence against the pinned map fixture.
  for (const longitude of [-140, -30]) {
    assert.ok(
      placesAt(longitude, -16.4, false).includes("Fiji"),
      "Pinned raw geometry must still reproduce the historical failure",
    );
    assert.deepEqual(
      placesAt(longitude, -16.4),
      [],
      `Ocean at ${longitude}°, −16.4° must not acquire land from a seam crossing`,
    );
  }
});

test("known ocean checkpoints remain ocean after seam handling", () => {
  for (const [label, longitude, latitude] of [
    ["mid-Pacific", -140, 0],
    ["North Atlantic", -30, 25],
    ["South Atlantic", -10, -40],
  ]) {
    assert.deepEqual(placesAt(longitude, latitude), [], label);
  }
});

test("representative country interiors and Antarctica remain land", () => {
  for (const [name, longitude, latitude] of [
    ["United States of America", -98, 39],
    ["Australia", 134, -25],
    ["China", 104, 35],
    ["Dem. Rep. Congo", 20, 1],
    ["Japan", 138, 36],
    ["Antarctica", 10, -80],
  ]) {
    assert.ok(placesAt(longitude, latitude).includes(name), name);
  }
});
