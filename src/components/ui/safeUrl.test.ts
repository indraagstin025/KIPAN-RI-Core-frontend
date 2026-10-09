// FAIL-path guard tautan: skema berbahaya wajib ditolak.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeHref } from './safeUrl.ts';

test('relatif dan anchor lolos', () => {
  for (const h of ['/lacak', '/admin/users', '#bantuan', '/', '/a?x=1&y=2']) {
    assert.equal(isSafeHref(h), true, h);
  }
});

test('http(s) lolos', () => {
  assert.equal(isSafeHref('https://kipan.id'), true);
  assert.equal(isSafeHref('HTTP://Contoh.COM/x'), true);
});

test('skema berbahaya ditolak', () => {
  for (const h of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//evil.com/x',
    '',
    '   ',
  ]) {
    assert.equal(isSafeHref(h), false, JSON.stringify(h));
  }
});
