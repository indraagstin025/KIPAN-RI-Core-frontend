import { PERSYARATAN } from '../constants/persyaratan';
import type { DaftarForm } from '../hooks/useDaftarForm';

export default function LangkahPersyaratan({ form }: { form: DaftarForm }) {
  const { persyaratan, togglePersyaratan, visibleError } = form;

  return (
    <div>
      <p className="text-base font-bold text-kipan-text-dark">Persyaratan Keanggotaan</p>
      <p className="mt-1 text-sm text-kipan-text-muted">Centang seluruh persyaratan di bawah ini untuk melanjutkan.</p>
      <div className="mt-4 grid gap-3">
        {PERSYARATAN.map((p) => {
          const checked = persyaratan.includes(p.title);
          return (
            <label
              key={p.title}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                checked ? 'border-kipan-navy bg-kipan-soft-blue' : 'border-kipan-border hover:border-kipan-blue/50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePersyaratan(p.title)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-kipan-navy"
              />
              <span>
                <span className="block text-sm font-semibold text-kipan-text-dark">{p.title}</span>
                <span className="mt-0.5 block text-xs text-kipan-text-muted">{p.desc}</span>
              </span>
            </label>
          );
        })}
      </div>
      {visibleError('persyaratan') && (
        <p className="mt-3 text-xs font-medium text-kipan-red">{visibleError('persyaratan')}</p>
      )}
    </div>
  );
}
