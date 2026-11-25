import { useEffect, useRef, useState } from 'react';

export function RecCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = cursorRef.current;
      if (el) {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      const target = e.target as HTMLElement | null;
      setHovering(Boolean(target?.closest('button, [role="slider"], [role="tab"]')));
    };

    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={`rec-cursor ${hovering ? 'hovering' : ''} ${pressed ? 'pressed' : ''}`}
    />
  );
}
