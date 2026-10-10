import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DECISION_GROUPS, extractAlasan } from './decisionMeta.ts';

test('preset mencakup 12 aksi putusan', () => {
  const semua = DECISION_GROUPS.find((g) => g.key === 'semua');
  assert.ok(semua);
  assert.equal(semua.aksi.length, 12);
  for (const k of ['SETUJUI', 'APPROVE', 'PAW', 'DSAR_PUTUSAN', 'BYPASS_VERIFIKASI']) {
    assert.ok(semua.aksi.includes(k), k);
  }
});

test('extractAlasan tiga kunci', () => {
  assert.equal(extractAlasan('{"from":"X","to":"Y","alasan":"kurang syarat"}'), 'kurang syarat');
  assert.equal(extractAlasan('{"bypass_alasan":"darurat"}'), 'darurat');
  assert.equal(extractAlasan('{"event":"x","catatan":"oke"}'), 'oke');
});

test('extractAlasan tanpa kunci / rusak / kosong', () => {
  assert.equal(extractAlasan('{"from":"A","to":"B"}'), null);
  assert.equal(extractAlasan('bukan json'), null);
  assert.equal(extractAlasan(null), null);
  assert.equal(extractAlasan('{"alasan":"   "}'), null);
});
