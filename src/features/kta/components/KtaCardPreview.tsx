export interface KtaCardData {
  nia: string;
  namaLengkap: string;
  status: string;
  tipe: string;
  jabatan: string;
  provinsiNama?: string;
  kabupatenNama?: string;
  tanggalAngkat?: string;
  email?: string;
  whatsapp?: string;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
      <p className="truncate text-xs font-bold text-white">{value && value.trim() ? value : '-'}</p>
    </div>
  );
}

function BackRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-kipan-text-muted">{label}</span>
      <span className="max-w-[60%] text-right text-xs font-semibold text-kipan-text-dark">
        {value && value.trim() ? value : '-'}
      </span>
    </div>
  );
}

function formatTanggal(d?: string): string {
  if (!d) return '-';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '-';
  return t.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// KtaCardPreview menampilkan pratinjau KTA dua sisi (depan & belakang) murni
// client-side dari data anggota yang sudah tersedia. Ini adalah pratinjau gaya
// aplikasi (bukan artwork final): latar/koordinat dapat diganti tanpa mengubah
// alur ketika desain resmi siap.
export default function KtaCardPreview({ data, fotoUrl }: { data: KtaCardData; fotoUrl?: string | null }) {
  const inisial = (data.namaLengkap || '?').charAt(0).toUpperCase();
  const wilayah = data.kabupatenNama || data.provinsiNama || '-';

  return (
    <div>
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Pratinjau sementara — tampilan dapat berubah menyesuaikan desain KTA final.
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Sisi depan */}
        <div className="relative aspect-[85/54] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-kipan-navy to-kipan-blue text-white shadow-md">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-white/5" />
          <div className="relative flex h-full flex-col p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-kipan.jpg"
                alt="Logo KIPAN"
                className="h-9 w-9 rounded-full border border-white/30 bg-white object-cover"
              />
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-widest text-kipan-yellow">Kartu Tanda Anggota</p>
                <p className="text-xs font-extrabold">KIPAN Indonesia</p>
                <p className="text-[9px] text-white/70">Kader Inti Pemuda Anti Narkoba</p>
              </div>
            </div>

            <div className="mt-3 flex flex-1 gap-3 sm:gap-4">
              <div className="shrink-0">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={data.namaLengkap}
                    className="h-20 w-16 rounded-lg border-2 border-white/30 object-cover sm:h-24 sm:w-20"
                  />
                ) : (
                  <div className="flex h-20 w-16 items-center justify-center rounded-lg border-2 border-white/30 bg-white/10 text-2xl font-bold sm:h-24 sm:w-20">
                    {inisial}
                  </div>
                )}
              </div>
              <div className="grid min-w-0 flex-1 content-start gap-2">
                <Field label="Nomer Anggota (NIA)" value={data.nia} />
                <Field label="Nama Lengkap" value={data.namaLengkap} />
                <Field label="Jabatan" value={data.jabatan} />
              </div>
            </div>

            <p className="mt-auto text-[9px] italic text-white/70">
              Kartu ini bukan pengganti identitas resmi negara.
            </p>
          </div>
        </div>

        {/* Sisi belakang */}
        <div className="relative aspect-[85/54] w-full overflow-hidden rounded-2xl border border-kipan-border bg-white shadow-md">
          <div className="flex h-full flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-kipan-border pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-kipan-navy">Kartu Anggota Resmi</p>
              <span className="rounded bg-kipan-soft-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-kipan-navy">
                {data.tipe || 'ANGGOTA'}
              </span>
            </div>

            <div className="mt-3 flex flex-1 gap-4">
              <div className="grid min-w-0 flex-1 content-start gap-2">
                <BackRow label="Status" value={data.status} />
                <BackRow label="Jabatan" value={data.jabatan} />
                <BackRow label="Provinsi" value={data.provinsiNama} />
                <BackRow label="Kabupaten/Kota" value={data.kabupatenNama} />
                <BackRow label="Anggota Sejak" value={formatTanggal(data.tanggalAngkat)} />
                <BackRow label="Kontak" value={data.email || data.whatsapp} />
              </div>
              <div className="flex shrink-0 flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-kipan-border bg-kipan-soft-gray p-1 text-center text-[8px] font-semibold leading-tight text-kipan-text-muted sm:h-20 sm:w-20">
                  QR verifikasi (pratinjau)
                </div>
              </div>
            </div>

            <p className="mt-auto text-[9px] text-kipan-text-muted">
              Wilayah: {wilayah}. Pindai QR untuk memverifikasi keaslian kartu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
