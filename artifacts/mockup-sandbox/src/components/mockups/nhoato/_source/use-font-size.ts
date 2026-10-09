import { useCallback, useEffect, useState } from 'react';

export const SIZES = [1.125, 1.375, 1.625, 1.9, 2.25];
const KEY = 'versos-fonte';

export function useFontSize() {
  const [i, setI] = useState(() => {
    const v = Number(localStorage.getItem(KEY));
    return Number.isInteger(v) && v >= 0 && v < SIZES.length ? v : 1;
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--poem-size', `${SIZES[i]}rem`);
    localStorage.setItem(KEY, String(i));
  }, [i]);
  const inc = useCallback(() => setI((x) => Math.min(SIZES.length - 1, x + 1)), []);
  const dec = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  return { i, inc, dec, max: SIZES.length - 1 };
}
