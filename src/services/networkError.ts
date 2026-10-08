// src/services/networkError.ts
// Klasifikasi error jaringan status-0 (request tanpa respons HTTP).
//
// Konteks (audit timeout 09 Okt 2026): sebelumnya SEMUA status 0 dilaporkan
// sebagai "Server tidak merespons dalam 15 detik" — termasuk blokir CORS dan
// server mati, yang menyesatkan diagnosis. Browser SENGAJA tidak membedakan
// CORS vs server-down vs DNS gagal (semuanya: tanpa respons, ERR_NETWORK),
// jadi pesan harus netral dan HANYA boleh menyebut timeout bila axios
// memastikan timeout (ECONNABORTED). Modul murni tanpa import agar bisa
// diuji langsung dengan node --test (tanpa test-runner baru).

export interface NetworkErrorClass {
    code: 'TIMEOUT' | 'OFFLINE' | 'SERVER_UNREACHABLE';
    message: string;
}

export function classifyNetworkError(input: {
    axiosCode?: string;
    axiosMessage?: string;
    onLine: boolean;
    timeoutMs: number;
}): NetworkErrorClass {
    if (!input.onLine) {
        return {
            code: 'OFFLINE',
            message: 'Anda sedang offline. Perubahan tersimpan lokal dan dikirim saat online.',
        };
    }
    const code = (input.axiosCode ?? '').toUpperCase();
    const msg = (input.axiosMessage ?? '').toLowerCase();
    if (code === 'ECONNABORTED' || msg.includes('timeout')) {
        const seconds = Math.max(1, Math.round(input.timeoutMs / 1000));
        return {
            code: 'TIMEOUT',
            message: `Server tidak merespons dalam ${seconds} detik. Coba lagi.`,
        };
    }
    return {
        code: 'SERVER_UNREACHABLE',
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau hubungi admin.',
    };
}
