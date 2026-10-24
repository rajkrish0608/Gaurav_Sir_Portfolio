import { useEffect, useRef, useState } from 'react';
import { setRect, subscribe } from '../engine/director';
import { DATA } from '../data';
import TiltCard from '../components/TiltCard';

const SECTION_IDX = 1;
const MANIFESTO_WORDS = DATA.manifesto.split(/\s+/);
const RED_WORDS = new Set([
  'smart', 'smart.', 'processes', 'processes.', 'growth', 'growth.', 'boldly.', 'automate', 'agentic', 'intelligent'
]);

// Mechanical rolling digit odometer column (0..9, 0)
function OdometerDigit({ targetDigit, p }: { targetDigit: number; p: number }) {
  // Digit columns 0-9,0 that roll; lowest digit snaps with smoothstep .55-1, driven by scroll
  const smooth = p < 0.55 ? 0 : Math.pow((p - 0.55) / 0.45, 2) * (3 - 2 * ((p - 0.55) / 0.45));
  const rollVal = targetDigit * smooth;
  return (
    <div
      style={{
        display: 'inline-block',
        height: '1em',
        lineHeight: '1em',
        overflow: 'hidden',
        verticalAlign: 'top',
      }}
    >
      <div
        style={{
          transform: `translateY(-${rollVal * 10}%)`,
          transition: 'transform 0.05s linear',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <div key={i} style={{ height: '1em', lineHeight: '1em' }}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatOdometer({ value, suffix, p }: { value: number; suffix: string; p: number }) {
  const digits = String(value).split('').map(Number);
  return (
    <div
      className="odometer-value"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(36px, 3.8vw, 68px)',
        lineHeight: 1,
        color: 'var(--ink)',
        display: 'flex',
        alignItems: 'baseline',
      }}
    >
      {digits.map((d, i) => (
        <OdometerDigit key={i} targetDigit={d} p={p} />
      ))}
      <span style={{ color: 'var(--red)' }}>{suffix}</span>
    </div>
  );
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current!;
    const ro = new ResizeObserver(() => {
      setRect(SECTION_IDX, section.offsetTop, section.offsetHeight);
    });
    ro.observe(section);
    setRect(SECTION_IDX, section.offsetTop, section.offsetHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const unsub = subscribe((states) => {
      const state = states[SECTION_IDX];
      if (!state) return;
      const { p, exit } = state;

      setScrollProgress(p);

      // Section exit fade
      if (sectionRef.current) {
        sectionRef.current.style.opacity = String(Math.max(0, 1 - exit * 2.4));
      }

      // Word-by-word manifesto reveal
      const words = wordsRef.current;
      const totalWords = words.length;
      words.forEach((w, i) => {
        if (!w) return;
        const targetP = (i + 1) / totalWords;
        const diff = p * 1.3 - targetP;
        const wordP = Math.max(0, Math.min(1, (diff + 0.2) / 0.2));
        w.style.opacity = String(0.1 + wordP * 0.9);
        w.style.transform = `translateY(${(1 - wordP) * 0.25}em)`;
        w.style.filter = `blur(${(1 - wordP) * 4}px)`;
      });
    });
    return unsub;
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="section"
      style={{ height: '280vh' }}
    >
      <div className="section-inner" style={{ overflow: 'hidden' }}>
        {/* Front column: left: 50vw; right: 5vw; top: 15vh; bottom: 7vh; space-between */}
        <div
          className="about-content"
          style={{
            position: 'absolute',
            left: '50vw',
            right: '5vw',
            top: '15vh',
            bottom: '7vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          {/* Header */}
          <div>
            <div className="section-label">
              <span className="label-num">02</span> — About me
            </div>
            <h2
              className="about-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(44px, 5.2vw, 92px)',
                lineHeight: 0.88,
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
              }}
            >
              BRIDGING
              <br />
              STRATEGY &amp;
              <br />
              <span className="red">EXECUTION.</span>
            </h2>
          </div>

          {/* Manifesto paragraph: 4-6 lines, revealing word by word with scroll */}
          <p
            className="manifesto"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(24px, 2.4vw, 46px)',
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              maxWidth: '30em',
            }}
          >
            {MANIFESTO_WORDS.map((word, i) => {
              const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
              const isRed = RED_WORDS.has(cleanWord);
              return (
                <span
                  key={i}
                  ref={(el) => {
                    wordsRef.current[i] = el;
                  }}
                  className={`manifesto-word${isRed ? ' red' : ''}`}
                  style={{
                    opacity: 0.1,
                    display: 'inline-block',
                    marginRight: '0.28em',
                    transform: 'translateY(0.25em)',
                    filter: 'blur(4px)',
                    willChange: 'opacity, transform, filter',
                  }}
                >
                  {word}
                </span>
              );
            })}
          </p>

          {/* Glass Stat Cards with 3D Tilt */}
          <div
            className="stat-cards"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
            }}
          >
            {DATA.stats.map((stat, i) => (
              <TiltCard key={i} className="stat-card">
                <StatOdometer
                  value={stat.value}
                  suffix={stat.suffix}
                  p={scrollProgress}
                />
                <div
                  className="stat-label"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--mute)',
                    marginTop: '8px',
                  }}
                >
                  {stat.label}
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
