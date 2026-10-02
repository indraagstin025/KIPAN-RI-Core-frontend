import axios from 'axios';
import { ApiError, apiFetch } from '@/services/apiClient';
import type { DokumenCategory, PresignUploadResult, PresignViewResult } from '../types';

// uploadDokumen: minta tiket POST policy lalu kirim multipart/form-data.
// Field policy dikirim apa adanya; part "file" WAJIB terakhir (aturan S3).
// Ukuran file ditegakkan KERAS oleh storage via content-length-range.
export async function uploadDokumen(category: DokumenCategory, file: File): Promise<string> {
  const ticket = await apiFetch<PresignUploadResult>('/storage/presign-upload', {
    method: 'POST',
    data: {
      category,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    },
  });
  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.fields)) {
    form.append(key, value);
  }
  form.append('file', file, file.name);

  try {
    await axios.post(ticket.upload_url, form, { timeout: 60000 });
  } catch (err: unknown) {
    throw new ApiError(0, 'STORAGE_ERROR', describeStorageError(err));
  }
  return ticket.object_key;
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

// presignView: tiket baca dokumen privat (admin, teraudit + ter-scope).
export function presignView(key: string): Promise<PresignViewResult> {
  return apiFetch<PresignViewResult>(`/storage/presign-view?key=${encodeURIComponent(key)}`);
}
