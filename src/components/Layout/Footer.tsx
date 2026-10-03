import { Link } from 'react-router-dom';
import { ORG } from '@/data/landing';

export default function Footer() {
  return (
    <footer className="bg-[#061C33] text-blue-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo-kipan.jpg" alt="Logo KIPAN" className="h-11 w-11 rounded-full border border-white/20 bg-white object-cover" />
            <div className="leading-tight">
              <p className="text-lg font-extrabold text-white">
                {ORG.name} <span className="text-kipan-yellow">RI</span>
              </p>
              <p className="text-xs text-blue-100/70">Sistem Informasi KIPAN</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100/80">{ORG.full}. Mewujudkan Indonesia Bersinar — Bersih dari Narkoba.</p>
        </div>
        <nav aria-label="Tautan layanan">
          <p className="text-sm font-bold uppercase tracking-widest text-kipan-yellow">Layanan</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/daftar" className="hover:text-white">Daftar sebagai Kader</Link></li>
            <li><Link to="/lacak" className="hover:text-white">Lacak Status Pendaftaran</Link></li>
            <li><Link to="/verifikasi-kta" className="hover:text-white">Verifikasi KTA</Link></li>
            <li><Link to="/anggota" className="hover:text-white">Cek Keanggotaan Kader</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-kipan-yellow">Kontak</p>
          <p className="mt-4 text-sm text-blue-100/80">{ORG.email}</p>
          <p className="mt-2 text-xs leading-relaxed text-blue-100/60">Data pribadi dilindungi UU PDP No. 27/2022. NIK terenkripsi AES-256-GCM.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-blue-100/60 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {ORG.full}. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
