import { apiFetch } from '@/services/apiClient';
import type { OtpRequestResult, OtpVerifyResult } from '../types';

export function requestOtp(whatsapp: string): Promise<OtpRequestResult> {
  return apiFetch<OtpRequestResult>('/pendaftaran/otp/whatsapp/request', {
    method: 'POST',
    data: { whatsapp },
  });
}

export function verifyOtp(whatsapp: string, code: string): Promise<OtpVerifyResult> {
  return apiFetch<OtpVerifyResult>('/pendaftaran/otp/whatsapp/verify', {
    method: 'POST',
    data: { whatsapp, code },
  });
}
