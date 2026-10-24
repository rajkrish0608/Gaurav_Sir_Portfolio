import { useEffect, useRef, useState, useCallback } from 'react';
import { initDirector, startScroll, subscribe } from './engine/director';
import { loadFrames, onProgress, onFirstQuarterReady } from './engine/frames';
import Stage from './components/Stage';
import Chrome from './components/Chrome';
import BackLayer from './components/BackLayer';
import FrontLayer from './components/FrontLayer';
import Hero from './scenes/Hero';
import About from './scenes/About';
import Work from './scenes/Work';
import Journey from './scenes/Journey';
import Skills from './scenes/Skills';
import Awards from './scenes/Awards';
import Contact from './scenes/Contact';

// ─── Preloader ─────────────────────────────────────────────────────────────
function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    onProgress((loaded, total) => {
      if (total > 0) {
        // Tween load progress to counter 000 -> 100
        const pct = Math.min(100, Math.round((loaded / (total * 0.25)) * 100));
        setProgress(pct);
      }
    });
    onFirstQuarterReady(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setProgress(100);
      setTimeout(() => {
        setLeaving(true);
        setTimeout(onDone, 1200);
      }, 500);
    });
  }, [onDone]);

  return (
    <div className={`preloader ${leaving ? 'leaving' : ''}`}>
      <div className="pre-half pre-top" />
      <div className="pre-center">
        <div className="pre-label mono">INITIALIZING SYSTEM</div>
        <div className="pre-num">{String(progress).padStart(3, '0')}</div>
        <div className="pre-label mono">GAURAV SAINI · PORTFOLIO 2026</div>
      </div>
      <div className="pre-half pre-bot" />
    </div>
  );
}

// ─── Desktop Cursor ────────────────────────────────────────────────────────
function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const isBig = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (window.innerWidth < 820) return;
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px';
        dotRef.current.style.top = e.clientY + 'px';
      }
      const target = (e.target as HTMLElement).closest?.('[data-cursor]') as HTMLElement | null;
      const label = target?.getAttribute('data-cursor') ?? '';
      if (labelRef.current) labelRef.current.textContent = label;
      const big = !!label;
      if (big !== isBig.current) {
        isBig.current = big;
        ringRef.current?.classList.toggle('ring-big', big);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    
    function loop() {
      ring.current.x += (pos.current.x - ring.current.x) * 0.16;
      ring.current.y += (pos.current.y - ring.current.y) * 0.16;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + 'px';
        ringRef.current.style.top = ring.current.y + 'px';
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring">
        <span ref={labelRef} className="cursor-label" />
      </div>
    </>
  );
}

// ─── App Main ──────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [contactBlade, setContactBlade] = useState(0);

  useEffect(() => {
    initDirector();
    loadFrames();
    const unsub = subscribe((states) => {
      if (states[6]) setContactBlade(states[6].t);
    });
    return unsub;
  }, []);

  const handleDone = useCallback(() => {
    setReady(true);
    setPreloaderDone(true);
    startScroll();
  }, []);

  return (
    <>
      {!preloaderDone && <Preloader onDone={handleDone} />}
      <Cursor />
      
      {/* z0: Fixed Back Layer */}
      <BackLayer />
      
      {/* z1: Fixed Video Stage Canvas */}
      <Stage />
      
      {/* z2: Fixed Front Layer (Front half of skills orbit) */}
      <FrontLayer />
      
      {/* z50: HUD Navigation & Rail */}
      <div className="hud" style={{ zIndex: 50 }}>
        <Chrome contactBlade={contactBlade} />
      </div>
      
      {/* z3: Main Sections Stacking Context */}
      <main style={{ position: 'relative', zIndex: 3 }}>
        <Hero />
        <About />
        <Work />
        <Journey />
        <Skills />
        <Awards />
        <Contact />
      </main>
    </>
  );
}
