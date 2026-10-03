export type OutboxJenis =
  | 'STATUS_DISETUJUI'
  | 'STATUS_DITOLAK'
  | 'STATUS_PERBAIKAN'
  | 'SET_PASSWORD'
  | 'AKUN_TERHUBUNG';

export type OutboxStatus = 'pending' | 'sent' | 'failed';

export interface OutboxItem {
  id: number;
  jenis: OutboxJenis;
  pendaftaran_id?: number;
  user_id?: string;
  provinsi_id?: number;
  kabupaten_id?: number;
  to_email: string;
  subject: string;
  status: OutboxStatus;
  attempts: number;
  next_retry_at: string;
  sent_at?: string;
  last_error?: string;
  created_at: string;
}

export interface OutboxQuery {
  page?: number;
  limit?: number;
  jenis?: string;
  status?: string;
}
