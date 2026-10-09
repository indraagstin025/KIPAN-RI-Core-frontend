// isSafeHref allowlist skema tautan (anti open-redirect / javascript:-URL
// bila suatu hari href diisi data dinamis). Relatif selalu aman; absolut
// hanya http(s).
export function isSafeHref(href: string): boolean {
  const h = href.trim();
  if (h === '') return false;
  if (h.startsWith('/') && !h.startsWith('//')) return true;
  if (h.startsWith('#')) return true;
  const lower = h.toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
}
