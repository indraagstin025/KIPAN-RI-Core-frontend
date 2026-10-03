export interface Backup {
  id: number;
  filename: string;
  object_key: string;
  size_bytes: number;
  status: string;
  error?: string | null;
  created_by?: string | null;
  created_at: string;
}
