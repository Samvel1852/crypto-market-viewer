import { useEffect, useCallback, type RefObject } from 'react';

export const useOutsideClick = <T extends HTMLElement | null>(
  ref: RefObject<T>,
  callback: () => void,
) => {
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    },
    [ref, callback],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [handleClick]);
};
