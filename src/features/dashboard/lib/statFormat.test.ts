import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initials, niceCeil, pct, shortBulan, trendPoints } from './statFormat.ts';

test('pct aman dari nol', () => {
  assert.equal(pct(4, 4), 100);
  assert.equal(pct(0, 0), 0);
  assert.equal(pct(5, 9), 56);
});

test('shortBulan YYYY-MM', () => {
  assert.equal(shortBulan('2026-10'), 'Okt');
  assert.equal(shortBulan('2026-01'), 'Jan');
  assert.equal(shortBulan('Okt 2026'), 'Okt 2026');
});

test('initials dua huruf', () => {
  assert.equal(initials('Uji Artefak NIK'), 'UA');
  assert.equal(initials('Budi'), 'BU');
  assert.equal(initials('  '), '?');
});

test('niceCeil langkah wajar', () => {
  assert.equal(niceCeil(0), 2);
  assert.equal(niceCeil(9), 10);
  assert.equal(niceCeil(15), 15);
  assert.equal(niceCeil(45), 50);
});

test('trendPoints ujung-ke-ujung', () => {
  const { points, yMax } = trendPoints([0, 10], 420, 170, 26, 22, 14);
  assert.equal(yMax, 10);
  assert.equal(points.length, 2);
  assert.ok(points[0].x < points[1].x);
  assert.ok(points[0].y > points[1].y);
});
