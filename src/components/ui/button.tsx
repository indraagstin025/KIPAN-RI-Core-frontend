import { Link } from 'react-router-dom';

type Variant = 'primary' | 'accent' | 'outline-white' | 'outline-navy' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-kipan-blue text-white hover:bg-kipan-navy',
  accent: 'bg-kipan-yellow text-kipan-text-dark hover:brightness-95',
  'outline-white': 'border border-white/60 text-white hover:bg-white/10',
  'outline-navy': 'border border-kipan-navy/30 text-kipan-navy hover:bg-kipan-soft-blue',
  ghost: 'text-kipan-blue hover:bg-kipan-soft-blue',
};

interface ButtonProps {
  to?: string;
  href?: string;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({ to, href, variant = 'primary', children, className = '', type = 'button', disabled = false, onClick }: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-kipan-yellow disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={() => onClick?.()} className={cls}>
      {children}
    </button>
  );
}

export default Button;
