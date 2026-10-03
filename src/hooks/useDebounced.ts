import { useEffect, useState } from 'react';

// useDebouncedValue menunda propagasi nilai (mis. ketikan pencarian) selama
// delayMs — mengurangi lonjakan request saat mengetik (target B8: 300ms).
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
