export interface ActivityLog {
  id: number;
  actor_name: string;
  actor_role: string;
  entity_name: string;
  entity_id: string;
  action: string;
  ip_address: string;
  request_id: string;
  metadata?: string | null;
  created_at: string;
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  aksi?: string;
  // aksiIn: daftar aksi koma-pisah untuk filter multi-aksi Batch 3
  // (mis. "SETUJUI,TOLAK"). Backend validasi ketat (400 bila liar).
  aksiIn?: string;
  entitas?: string;
  aktor?: string;
  dari?: string;
  ke?: string;
}
