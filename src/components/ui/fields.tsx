import type { ReactNode } from 'react';

export const inputCls =
  'w-full rounded-lg border border-kipan-border bg-white px-3.5 py-2.5 text-sm text-kipan-text-dark placeholder:text-kipan-text-muted/60 focus:border-kipan-blue focus:outline-none focus:ring-2 focus:ring-kipan-blue/20';

export function Field({ label, required = false, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-kipan-text-dark">
        {label} {required && <span className="text-kipan-red">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-kipan-text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-kipan-red">{error}</span>}
    </label>
  );
}

interface TextProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel';
  maxLength?: number;
  id?: string;
  invalid?: boolean;
  onBlur?: () => void;
}

const invalidCls = 'border-kipan-red focus:border-kipan-red focus:ring-kipan-red/20';

export function TextInput({ value, onChange, placeholder, inputMode = 'text', maxLength, id, invalid = false, onBlur }: TextProps) {
  return (
    <input
      type="text"
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      aria-invalid={invalid || undefined}
      className={`${inputCls} ${invalid ? invalidCls : ''}`}
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4, id, invalid = false, onBlur }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
  invalid?: boolean;
  onBlur?: () => void;
}) {
  return (
    <textarea
      value={value}
      id={id}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${inputCls} ${invalid ? invalidCls : ''}`}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id,
  invalid = false,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  onBlur?: () => void;
}) {
  return (
    <select
      value={value}
      id={id}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={`${inputCls} disabled:bg-kipan-soft-gray ${invalid ? invalidCls : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info' | 'warning'; children: ReactNode }) {
  const cls =
    kind === 'error'
      ? 'border-kipan-red/30 bg-red-50 text-kipan-red'
      : kind === 'success'
        ? 'border-kipan-green/30 bg-emerald-50 text-kipan-green'
        : kind === 'warning'
          ? 'border-orange-300 bg-orange-50 text-orange-700'
          : 'border-kipan-blue/30 bg-kipan-soft-blue text-kipan-navy';
  return <div role={kind === 'error' ? 'alert' : undefined} className={`rounded-lg border p-4 text-sm leading-relaxed ${cls}`}>{children}</div>;
}

export function Stepper({ steps, active }: { steps: string[]; active: number }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Langkah">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-1 sm:gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              i < active ? 'bg-kipan-green text-white' : i === active ? 'bg-kipan-navy text-white' : 'bg-kipan-soft-gray text-kipan-text-muted'
            }`}
            aria-current={i === active ? 'step' : undefined}
          >
            {i < active ? '✓' : i + 1}
          </span>
          <span className={`hidden text-xs font-semibold sm:block ${i === active ? 'text-kipan-navy' : 'text-kipan-text-muted'}`}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px flex-1 bg-kipan-border" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
