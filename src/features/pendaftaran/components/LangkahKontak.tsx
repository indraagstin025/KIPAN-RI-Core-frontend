import { useState } from 'react';
import Button from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import TurnstileWidget from '@/components/ui/TurnstileWidget';
import { useTurnstileGate } from '@/components/ui/useTurnstileGate';
import type { DaftarForm } from '../hooks/useDaftarForm';
import { Field, TextArea, TextInput } from './fields';

export default function LangkahKontak({ form }: { form: DaftarForm }) {
  const {
    email, setEmail, wa, setWa, kode, setKode, motivasi, setMotivasi,
    bindText, markTouched, visibleError, isInvalid, otp,
  } = form;
  const gate = useTurnstileGate();
  const [tsError, setTsError] = useState<string | null>(null);
  const siapKirim = !otp.sending && otp.cooldown <= 0 && (!gate.enabled || gate.token !== null);

  async function kirimOtp(): Promise<void> {
    if (!siapKirim) return;
    const ok = await otp.kirim(wa, gate.token ?? undefined);
    gate.reset();
    if (!ok) return;
  }

  return (
    <div className="grid gap-5">
      <Field label="Email" required error={visibleError('email')} hint="Untuk akun & reset password">
        <TextInput value={email} {...bindText('email', setEmail)} inputMode="email" maxLength={255} id="f-email" invalid={isInvalid('email')} />
      </Field>
      <Field label="Nomor WhatsApp" required error={visibleError('wa')} hint="Contoh: 081234567890">
        <TextInput value={wa} onChange={(v) => { setWa(v); otp.resetUntuk(v); }} onBlur={() => markTouched('wa')} inputMode="tel" maxLength={16} id="f-wa" invalid={isInvalid('wa')} />
      </Field>
      <div className="rounded-xl border border-kipan-border bg-kipan-soft-blue p-4">
        <p className="text-sm font-bold text-kipan-navy">Verifikasi OTP WhatsApp</p>
        {gate.enabled && (
          <>
            <TurnstileWidget
              key={gate.widgetKey}
              onToken={(t) => { gate.handleToken(t); if (t) setTsError(null); }}
              onError={(m) => setTsError(m)}
            />
            {tsError && <p className="mt-2 text-xs font-medium text-kipan-red">{tsError}</p>}
          </>
        )}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline-navy" disabled={!siapKirim} onClick={() => void kirimOtp()}>
            {otp.sending ? (<span className="inline-flex items-center gap-2"><Spinner size={15} /> Mengirim...</span>) : otp.cooldown > 0 ? `Kirim ulang (${otp.cooldown}s)` : 'Kirim Kode OTP'}
          </Button>
        </div>
        {!siapKirim && gate.enabled && gate.token === null && otp.cooldown <= 0 && !otp.sending && (
          <p className="mt-2 text-xs text-kipan-text-muted">Selesaikan verifikasi keamanan di atas dulu untuk mengaktifkan tombol kirim.</p>
        )}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={kode}
            id="f-otp"
            onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit kode"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-invalid={isInvalid('otp') || undefined}
            className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 sm:max-w-[220px] ${isInvalid('otp') ? 'border-kipan-red focus:border-kipan-red focus:ring-kipan-red/20' : 'border-kipan-border focus:border-kipan-blue focus:ring-kipan-blue/20'}`}
          />
          <Button variant="primary" disabled={otp.verifying || kode.length !== 6} onClick={() => void otp.verifikasi(wa, kode)}>
            {otp.verifying ? (<span className="inline-flex items-center gap-2"><Spinner size={15} light /> Memeriksa...</span>) : 'Verifikasi'}
          </Button>
        </div>
        {otp.error && <p className="mt-2 text-xs font-medium text-kipan-red">{otp.error}</p>}
        {otp.verifiedToken && <p className="mt-2 text-xs font-semibold text-kipan-green">✓ Nomor terverifikasi. Token berlaku 15 menit.</p>}
        {visibleError('otp') && <p className="mt-2 text-xs font-medium text-kipan-red">{visibleError('otp')}</p>}
      </div>
      <Field label="Motivasi Bergabung dengan KIPAN" required error={visibleError('motivasi')} hint="20-1000 karakter">
        <TextArea value={motivasi} {...bindText('motivasi', setMotivasi)} rows={5} id="f-motivasi" invalid={isInvalid('motivasi')} />
      </Field>
    </div>
  );
}
