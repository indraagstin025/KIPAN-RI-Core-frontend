import axios from 'axios';
import { ApiError, apiFetch } from '@/services/apiClient';
import type { DokumenCategory, PresignUploadResult, PresignViewResult } from '../types';

// uploadDokumen: minta tiket POST policy lalu kirim multipart/form-data.
// Field policy dikirim apa adanya; part "file" WAJIB terakhir (aturan S3).
// Ukuran file ditegakkan KERAS oleh storage via content-length-range.
export async function uploadDokumen(category: DokumenCategory, file: File): Promise<string> {
  const t0 = performance.now();
  console.debug('[upl-dbg] tiket>', { category, name: file.name, size: file.size, type: file.type });
  const ticket = await apiFetch<PresignUploadResult>('/storage/presign-upload', {
    method: 'POST',
    data: {
      category,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    },
  });
  console.debug('[upl-dbg] tiket ok', { key: ticket.object_key, bucket: ticket.bucket, url_host: safeHost(ticket.upload_url) });
  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.fields)) {
    form.append(key, value);
  }
  form.append('file', file, file.name);

  try {
    await axios.post(ticket.upload_url, form, { timeout: 60000 });
    console.debug('[upl-dbg] POST ok', { key: ticket.object_key, ms: Math.round(performance.now() - t0) });
  } catch (err: unknown) {
    console.debug('[upl-dbg] POST gagal', { key: ticket.object_key, ms: Math.round(performance.now() - t0), err });
    throw new ApiError(0, 'STORAGE_ERROR', describeStorageError(err));
  }
  return ticket.object_key;
}

// safeHost mengambil host dari URL tanpa query/signature (aman untuk log).
function safeHost(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return '?';
  }
}

// describeStorageError menerjemahkan kegagalan unggah langsung ke penyimpanan
// (MinIO/S3) menjadi pesan yang jelas — termasuk kode error XML dari storage.
function describeStorageError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Tidak dapat terhubung ke penyimpanan berkas. Pastikan layanan storage (MinIO) aktif dan mengizinkan akses dari browser (CORS).';
    }
    const status = err.response.status;
    const body = err.response.data;
    const code = typeof body === 'string' ? (body.match(/<Code>([^<]+)<\/Code>/)?.[1] ?? '') : '';
    const detail =
      status === 400
        ? 'Berkas ditolak penyimpanan (kemungkinan melebihi batas ukuran atau format tidak sesuai).'
        : status === 403
          ? 'Izin unggah ditolak oleh penyimpanan (tiket kedaluwarsa atau kebijakan tidak cocok).'
          : 'Terjadi kesalahan pada penyimpanan berkas.';
    return `${detail} (HTTP ${status}${code ? ` ${code}` : ''})`;
  }
  return err instanceof Error ? err.message : 'Unggah berkas gagal.';
}

// verifyDokumen: gerbang langkah — pastikan objek benar-benar valid di
// server SEBELUM lanjut ke Persyaratan (masalah muncul dini, bukan misteri
// di submit). Tanpa purge (cek murni); submit final yang memutuskan.
export function verifyDokumen(key: string, category: DokumenCategory): Promise<void> {
  const t0 = performance.now();
  console.debug('[upl-dbg] verify>', { key, category });
  return apiFetch<void>('/storage/verify-upload', {
    method: 'POST',
    data: { key, category },
  }).then(
    () => {
      console.debug('[upl-dbg] verify ok', { key, ms: Math.round(performance.now() - t0) });
    },
    (e: unknown) => {
      console.debug('[upl-dbg] verify gagal', { key, ms: Math.round(performance.now() - t0), err: e instanceof Error ? e.message : e });
      throw e;
    },
  );
}
// presignView: tiket baca dokumen privat (admin, teraudit + ter-scope).
export function presignView(key: string): Promise<PresignViewResult> {
  return apiFetch<PresignViewResult>(`/storage/presign-view?key=${encodeURIComponent(key)}`);
}
