import { useEffect, useRef } from 'react';

interface OdometerProps {
  value: number;
  suffix?: string;
}

function smoothstep(lo: number, hi: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

export default function Odometer({ value, suffix = '' }: OdometerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const target = value;
    const duration = 1200;
    const start = performance.now();
    const from = currentRef.current;

    cancelAnimationFrame(animRef.current);
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = smoothstep(0.0, 1.0, progress);
      const current = Math.round(from + (target - from) * eased);
      currentRef.current = current;
      if (ref.current) {
        ref.current.textContent = String(current).padStart(String(target).length, '0') + suffix;
      }
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, suffix]);

  return (
    <div ref={ref} className="odometer-value">
      {'0'.repeat(String(value).length) + suffix}
    </div>
  );
}
