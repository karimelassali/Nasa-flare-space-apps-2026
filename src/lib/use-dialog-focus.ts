'use client';

import { useEffect, useRef, type RefObject } from 'react';

export function useDialogFocus(open: boolean, container: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open || !container.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const root = container.current;
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex="0"]')).filter((el) => el.getClientRects().length > 0);
    document.body.style.overflow = 'hidden';
    (focusable()[0] ?? root).focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === root || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    root.addEventListener('keydown', handleKey);
    return () => {
      root.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, container]);
}
