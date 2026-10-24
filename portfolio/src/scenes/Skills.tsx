import { useEffect, useRef } from 'react';
import { setRect, subscribe } from '../engine/director';
import { DATA } from '../data';

const SECTION_IDX = 4;
const SKILLS = DATA.skills;
const TILT = -0.28;
const SQUASH = 0.78;
const AUTO_SPEED = 0.0004;

interface Chip {
  label: string;
  theta: number;
  phi: number;
  x: number;
  y: number;
  z: number;
}

function fibonacci(n: number): Chip[] {
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const phi = 2 * Math.PI * (1 - 1 / goldenRatio);
  return SKILLS.slice(0, n).map((label, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    return {
      label,
      theta,
      phi: Math.asin(Math.max(-1, Math.min(1, y))),
      x: Math.cos(theta) * r,
      y,
      z: Math.sin(theta) * r,
    };
  });
}

function rotateY(chip: Chip, angle: number): Chip {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    ...chip,
    x: chip.x * cos + chip.z * sin,
    z: -chip.x * sin + chip.z * cos,
  };
}

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const scrollAngle = useRef(0);
  const mouseX = useRef(0);
  const rafRef = useRef(0);
  const isVisible = useRef(false);

  useEffect(() => {
    const section = sectionRef.current!;
    const ro = new ResizeObserver(() => {
      setRect(SECTION_IDX, section.offsetTop, section.offsetHeight);
    });
    ro.observe(section);
    setRect(SECTION_IDX, section.offsetTop, section.offsetHeight);

    const onMouse = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  useEffect(() => {
    const unsub = subscribe((states) => {
      const state = states[SECTION_IDX];
      if (!state) return;
      scrollAngle.current = state.p * 5.0;
      isVisible.current = state.vis > 0.02;

      // Exit fade for foreground elements
      if (sectionRef.current) {
        sectionRef.current.style.opacity = String(Math.max(0, 1 - state.exit * 2.4));
      }

      // Marquee tape moves with scroll
      if (marqueeRef.current) {
        const offset = state.p * -40;
        marqueeRef.current.style.transform = `translateX(${offset}%)`;
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const chips = fibonacci(SKILLS.length);

    function render() {
      const back = document.getElementById('skills-orbit-back');
      const front = document.getElementById('skills-orbit-front');

      if (!isVisible.current || !back || !front) {
        if (back) back.innerHTML = '';
        if (front) front.innerHTML = '';
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      angleRef.current += AUTO_SPEED;
      const totalAngle = angleRef.current + scrollAngle.current + mouseX.current * 0.45;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const R = Math.min(vw * 0.27, vh * 0.46);

      // Clean containers
      back.innerHTML = '';
      front.innerHTML = '';

      const cosT = Math.cos(TILT);
      const sinT = Math.sin(TILT);

      const rotated = chips.map((c) => {
        const rx = rotateY(c, totalAngle);
        return {
          ...rx,
          y: rx.y * cosT - rx.z * sinT,
          z: rx.y * sinT + rx.z * cosT,
        };
      });

      const centerX = vw / 2;
      const centerY = vh / 2;

      rotated.forEach((c) => {
        const sx = centerX + c.x * R;
        const sy = centerY + c.y * R * SQUASH;
        const sz = c.z;

        const el = document.createElement('div');
        el.textContent = c.label;
        el.style.position = 'absolute';
        el.style.left = `${sx}px`;
        el.style.top = `${sy}px`;
        el.style.userSelect = 'none';
        el.style.whiteSpace = 'nowrap';
        el.style.pointerEvents = 'none';

        if (sz < 0) {
          // BACK LAYER: red text, white 75%, red border, fainter
          el.className = 'orbit-chip-back';
          el.style.fontFamily = 'var(--font-mono)';
          el.style.fontSize = '12px';
          el.style.letterSpacing = '0.04em';
          el.style.textTransform = 'uppercase';
          el.style.color = 'var(--red)';
          el.style.background = 'rgba(255, 255, 255, 0.75)';
          el.style.border = '1px solid var(--red)';
          el.style.borderRadius = '100px';
          el.style.padding = '6px 14px';
          const depthScale = 0.65 + (sz + 1) * 0.25;
          el.style.transform = `translate(-50%, -50%) scale(${depthScale})`;
          el.style.opacity = String(0.25 + (sz + 1) * 0.45);
          back.appendChild(el);
        } else {
          // FRONT LAYER: red pill, white text, glow
          el.className = 'orbit-chip-front';
          el.style.fontFamily = 'var(--font-mono)';
          el.style.fontSize = '12px';
          el.style.letterSpacing = '0.04em';
          el.style.textTransform = 'uppercase';
          el.style.color = '#ffffff';
          el.style.background = 'var(--red)';
          el.style.borderRadius = '100px';
          el.style.padding = '7px 16px';
          el.style.boxShadow = '0 8px 24px rgba(255, 31, 31, 0.45)';
          const depthScale = 0.9 + sz * 0.25;
          el.style.transform = `translate(-50%, -50%) scale(${depthScale})`;
          el.style.opacity = String(0.85 + sz * 0.15);
          front.appendChild(el);
        }
      });

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <section ref={sectionRef} id="skills" className="section" style={{ height: '280vh' }}>
      <div className="section-inner" style={{ overflow: 'hidden' }}>
        {/* Title Top-Left */}
        <div
          className="skills-header"
          style={{
            position: 'absolute',
            top: '12vh',
            left: '5vw',
            zIndex: 10,
          }}
        >
          <div className="section-label">
            <span className="label-num">05</span> — Toolkit
          </div>
          <h2
            className="skills-title"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 5.5vw, 96px)',
              lineHeight: 0.88,
              textTransform: 'uppercase',
            }}
          >
            EVERYTHING
            <br />
            <span className="red">IN ORBIT.</span>
          </h2>
        </div>

        {/* Bottom Red Marquee Tape */}
        <div
          className="skills-marquee-tape"
          style={{
            position: 'absolute',
            bottom: '4vh',
            left: '-5vw',
            width: '110vw',
            height: '10vh',
            background: 'var(--red)',
            transform: 'rotate(-2deg)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(255, 31, 31, 0.3)',
            zIndex: 10,
          }}
        >
          <div
            ref={marqueeRef}
            className="marquee-inner"
            style={{
              display: 'flex',
              whiteSpace: 'nowrap',
              willChange: 'transform',
            }}
          >
            {[...SKILLS, ...SKILLS, ...SKILLS].map((s, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 3.2vw, 56px)',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  padding: '0 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '24px',
                }}
              >
                {s} <span style={{ opacity: 0.6, fontSize: '0.6em' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
