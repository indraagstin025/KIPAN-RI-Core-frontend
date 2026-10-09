// FAIL-path anti-enumeration pintu anggota: error MFA wajib disamarkan
// menjadi pesan generik yang sama persis dengan backend.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MfaRequiredError, MfaSetupRequiredError } from '../types.ts';
import { LOGIN_GAGAL_GENERIK, mapMemberLoginError } from './memberLoginError.ts';

test('akun ber-MFA disamarkan', () => {
  const mapped = mapMemberLoginError(new MfaRequiredError({ mfa_required: true, challenge_token: 'c', expires_in: 300 }));
  assert.equal(mapped.message, LOGIN_GAGAL_GENERIK);
  assert.equal(mapped.message, 'Email atau kata sandi tidak sesuai.');
});

test('akun wajib-enroll disamarkan', () => {
  const mapped = mapMemberLoginError(new MfaSetupRequiredError('enroll-tok'));
  assert.equal(mapped.message, LOGIN_GAGAL_GENERIK);
});

test('error biasa diteruskan apa adanya', () => {
  const src = new Error('jaringan putus');
  assert.equal(mapMemberLoginError(src), src);
});

test('non-Error menjadi login gagal generik', () => {
  assert.equal(mapMemberLoginError('aneh').message, 'Login gagal');
});
