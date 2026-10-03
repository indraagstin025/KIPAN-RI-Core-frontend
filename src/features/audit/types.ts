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
  entitas?: string;
  aktor?: string;
  dari?: string;
  ke?: string;
}
