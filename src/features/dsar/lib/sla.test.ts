import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sisaJam } from './sla.ts';

test('sisa positif untuk due masa depan', () => {
  const due = new Date(Date.now() + 70 * 3600000).toISOString();
  const v = sisaJam(due);
  assert.ok(v >= 69 && v <= 70, `harap ~70, dapat ${v}`);
});

test('negatif untuk due lewat', () => {
  const due = new Date(Date.now() - 5 * 3600000).toISOString();
  assert.ok(sisaJam(due) <= -5);
});
