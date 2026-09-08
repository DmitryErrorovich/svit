import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../calculation.mjs';
import { matchStations, stations } from '../stations.mjs';

const load = watts => [{ watts, quantity: 1, active: true }];

test('default 93 W desk for four hours excludes undersized batteries', () => {
  const items = matchStations(calculate(load(93), 4, 85, 10), 4);
  assert.deepEqual(items.filter(s => s.matches).map(s => s.id),
    ['river-2-max', 'river-2-pro', 'delta-3', 'bluetti-ac180']);
  assert.ok(Math.abs(items[0].runtimeHours - 512 * 0.85 * 0.9 / 93) < 1e-10);
});

test('AC power can disqualify a model even when its battery is sufficient', () => {
  const catalog = [{ id: 'weak-output', capacityWh: 2000, acWatts: 100 }];
  const [item] = matchStations(calculate(load(200), 2, 85, 10), 2, catalog);
  assert.equal(item.meetsDuration, true);
  assert.equal(item.supportsLoad, false);
  assert.equal(item.matches, false);
});

test('a working output without the requested power reserve is not a match', () => {
  const [item] = matchStations(calculate(load(200), 2, 85, 10), 2,
    [{ id: 'no-reserve', capacityWh: 1000, acWatts: 240 }]);
  assert.equal(item.supportsLoad, true);
  assert.equal(item.hasPowerReserve, false);
  assert.equal(item.matches, false);
});

test('exact-duration matches are not rejected by display-capacity rounding', () => {
  const result = calculate(load(128), 4, 100, 0);
  assert.equal(result.capacity, 520);
  const [item] = matchStations(result, 4, [{ id: 'exact', capacityWh: 512, acWatts: 200 }]);
  assert.equal(item.runtimeHours, 4);
  assert.equal(item.matches, true);
});

test('power margin boundary is inclusive and the next smaller output fails', () => {
  const result = calculate(load(100), 4, 100, 0);
  const items = matchStations(result, 4, [
    { id: 'enough', capacityWh: 500, acWatts: 130 },
    { id: 'short', capacityWh: 500, acWatts: 129 },
  ]);
  assert.equal(items[0].matches, true);
  assert.equal(items[1].matches, false);
});

test('changing time, efficiency and reserve immediately changes recommendations', () => {
  const ids = (hours, efficiency, reserve) => matchStations(calculate(load(93), hours, efficiency, reserve), hours).filter(s => s.matches).map(s => s.id);
  assert.equal(ids(2, 85, 10).length, 6);
  assert.deepEqual(ids(8, 85, 10), ['delta-3', 'bluetti-ac180']);
  assert.deepEqual(ids(12, 50, 50), []);
});

test('invalid and zero load have no stale model recommendations', () => {
  for (const result of [null, calculate([], 4, 85, 10), calculate(load(NaN), 4, 85, 10)]) {
    assert.deepEqual(matchStations(result, 4), []);
  }
});

test('catalog uses unique model IDs and source URLs for all six versions', () => {
  assert.equal(new Set(stations.map(s => s.id)).size, 6);
  for (const station of stations) {
    assert.ok(station.capacityWh > 0 && station.acWatts > 0);
    assert.equal(new URL(station.source).protocol, 'https:');
    assert.ok(station.version.startsWith('EU'));
  }
});
