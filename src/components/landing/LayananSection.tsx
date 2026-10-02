import Button from '../ui/button';
import Reveal from '../Layout/Reveal';

const items = [
  {
    title: 'Lacak Status Pendaftaran',
    desc: 'Masukkan nomor pendaftaran (REG-YYYYMM-XXXXX) untuk melihat status berkas: Diajukan, Diverifikasi, Perbaikan, Disetujui, atau Ditolak.',
    to: '/lacak',
    cta: 'Lacak Sekarang',
  },
  {
    title: 'Verifikasi Keaslian KTA',
    desc: 'Pastikan Kartu Tanda Anggota asli dengan memasukkan NIA dan kode signature dari QR — dilengkapi verdict kriptografis.',
    to: '/verifikasi-kta',
    cta: 'Verifikasi KTA',
  },
];

export default function LayananSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-kipan-blue">Layanan Mandiri</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-kipan-text-dark sm:text-4xl">Sudah Mendaftar?</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {items.map((it, i) => (
            <Reveal key={it.to} delayMs={i * 120}>
              <article className="flex h-full flex-col rounded-2xl bg-kipan-navy p-7 text-white sm:p-8">
                <h3 className="text-xl font-bold">{it.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-blue-100/85">{it.desc}</p>
                <div className="mt-6">
                  <Button to={it.to} variant="accent">
                    {it.cta} <span aria-hidden="true">→</span>
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
