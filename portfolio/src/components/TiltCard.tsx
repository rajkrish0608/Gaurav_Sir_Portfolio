import { useRef, useCallback, ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  className?: string;
}

export default function TiltCard({ children, maxTilt = 14, className = '' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = x * maxTilt * 2;
    const rotX = -y * maxTilt * 2;
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04)`;
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${(x+0.5)*100}% ${(y+0.5)*100}%, rgba(255,255,255,0.35) 0%, transparent 60%)`;
    }
  }, [maxTilt]);

  const onMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    if (glareRef.current) {
      glareRef.current.style.background = 'transparent';
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ transition: 'transform 0.1s ease', transformStyle: 'preserve-3d' }}
    >
      <div ref={glareRef} className="tilt-glare" />
      {children}
    </div>
  );
}
