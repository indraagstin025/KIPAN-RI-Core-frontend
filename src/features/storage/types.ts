export type DokumenCategory = 'foto' | 'ktp' | 'cv' | 'sk' | 'surat_pernyataan' | 'surat_sehat';

export interface PresignUploadResult {
  upload_url: string;
  /** Field form POST policy — kirim apa adanya, berkas ("file") terakhir. */
  fields: Record<string, string>;
  object_key: string;
  bucket: string;
  expires_in: number;
  mime_type: string;
  max_size_bytes: number;
}

export interface PresignViewResult {
  view_url: string;
  object_key: string;
  expires_in: number;
}
