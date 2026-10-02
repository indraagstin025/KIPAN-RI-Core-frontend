import axios from 'axios';
import { API_BASE_URL } from '@/config/env';

export interface HealthStatus {
  status: string;
  time: string;
}

// checkHealth: endpoint publik /health (di luar prefix /api/v1, tanpa envelope).
export async function checkHealth(): Promise<HealthStatus> {
  const res = await axios.get<HealthStatus>(`${API_BASE_URL}/health`, { timeout: 8000 });
  return res.data;
}
