// FAIL-path audit timeout (item C): setiap kegagalan jaringan tanpa respons
// harus dipetakan ke pesan yang benar — khususnya non-timeout TIDAK BOLEH
// menyebut "detik"/"merespons" agar tak mengecoh diagnosis seperti kasus CORS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyNetworkError } from './networkError.ts';

const T = 15000;

test('timeout axios (ECONNABORTED) menyebut durasi', () => {
    const r = classifyNetworkError({
        axiosCode: 'ECONNABORTED',
        axiosMessage: 'timeout of 15000ms exceeded',
        onLine: true,
        timeoutMs: T,
    });
    assert.equal(r.code, 'TIMEOUT');
    assert.match(r.message, /15 detik/);
});

test('blokir CORS (tanpa code, tanpa respons) bukan timeout', () => {
    const r = classifyNetworkError({
        axiosCode: undefined,
        axiosMessage: 'Network Error',
        onLine: true,
        timeoutMs: T,
    });
    assert.equal(r.code, 'SERVER_UNREACHABLE');
    assert.doesNotMatch(r.message, /detik|merespons/);
});

test('server mati (ERR_NETWORK) bukan timeout', () => {
    const r = classifyNetworkError({
        axiosCode: 'ERR_NETWORK',
        axiosMessage: 'Network Error',
        onLine: true,
        timeoutMs: T,
    });
    assert.equal(r.code, 'SERVER_UNREACHABLE');
    assert.doesNotMatch(r.message, /detik|merespons/);
});

test('offline tetap OFFLINE walau ada code jaringan', () => {
    const r = classifyNetworkError({
        axiosCode: 'ERR_NETWORK',
        axiosMessage: 'Network Error',
        onLine: false,
        timeoutMs: T,
    });
    assert.equal(r.code, 'OFFLINE');
});
