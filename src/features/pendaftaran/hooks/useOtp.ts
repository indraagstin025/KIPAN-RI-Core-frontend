import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/services/apiClient';
import { requestOtp, verifyOtp } from '../api/otpService';

export function useOtp() {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [verifiedFor, setVerifiedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  function startCooldown(secs: number): void {
    setCooldown(secs);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timer.current) window.clearInterval(timer.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  }

  async function kirim(whatsapp: string): Promise<boolean> {
    setSending(true);
    setError(null);
    try {
      const res = await requestOtp(whatsapp);
      startCooldown(res.resend_in || 60);
      return true;
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengirim kode OTP');
      return false;
    } finally {
      setSending(false);
    }
  }

  async function verifikasi(whatsapp: string, code: string): Promise<boolean> {
    setVerifying(true);
    setError(null);
    try {
      const res = await verifyOtp(whatsapp, code);
      setVerifiedToken(res.verified_token);
      setVerifiedFor(whatsapp.trim());
      return true;
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Verifikasi gagal');
      return false;
    } finally {
      setVerifying(false);
    }
  }

  function resetUntuk(nomorBaru: string): void {
    if (verifiedFor !== null && verifiedFor !== nomorBaru.trim()) {
      setVerifiedToken(null);
      setVerifiedFor(null);
    }
  }

  return { sending, verifying, cooldown, verifiedToken, error, kirim, verifikasi, resetUntuk };
}
