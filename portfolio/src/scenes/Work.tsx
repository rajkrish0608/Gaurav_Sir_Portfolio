import { useEffect, useRef, useState } from 'react';
import { setRect, subscribe } from '../engine/director';
import { DATA } from '../data';

const SECTION_IDX = 2;
const PROJECTS = DATA.projects;

function GaugeVisual() {
  return (
    <div className="visual-gauge" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 120" style={{ width: '80%', maxHeight: '140px' }} fill="none">
        <path d="M20 100 A80 80 0 0 1 180 100" stroke="rgba(255,255,255,0.2)" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          stroke="#ffffff"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="251"
          strokeDashoffset="65"
        />
        <circle cx="100" cy="100" r="8" fill="#ffffff" />
        <line
          x1="100"
          y1="100"
          x2="48"
          y2="52"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <text x="100" y="86" textAnchor="middle" fill="#ffffff" fontSize="22" fontFamily="var(--font-display)">
          84%
        </text>
      </svg>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '10px' }}>
        REAL-TIME TELEMETRY
      </div>
    </div>
  );
}

function HeatmapVisual() {
  return (
    <div className="visual-heatmap" style={{ width: '100%', height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', width: '100%', maxWidth: '240px' }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1',
              borderRadius: '4px',
              background: '#ffffff',
              opacity: 0.15 + (i * 17 % 10) * 0.08,
            }}
          />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '16px' }}>
        FLEET ACTIVITY MATRIX
      </div>
    </div>
  );
}

function ChatVisual() {
  const msgs = [
    { text: 'ERP sync complete: 1,420 orders', side: 'left' },
    { text: 'Agentic AI: dispatch routes optimized', side: 'right' },
    { text: 'Operations efficiency +38%', side: 'left' },
  ];
  return (
    <div className="visual-chat" style={{ width: '100%', height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
      {msgs.map((m, i) => (
        <div
          key={i}
          style={{
            alignSelf: m.side === 'left' ? 'flex-start' : 'flex-end',
            background: m.side === 'left' ? 'rgba(255,255,255,0.92)' : 'rgba(13,13,13,0.85)',
            color: m.side === 'left' ? '#ff1f1f' : '#ffffff',
            padding: '10px 16px',
            borderRadius: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.02em',
            maxWidth: '85%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {m.text}
        </div>
      ))}
    </div>
  );
}

const VISUALS = [GaugeVisual, HeatmapVisual, ChatVisual];

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

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

      // Exit fade
      if (sectionRef.current) {
        sectionRef.current.style.opacity = String(Math.max(0, 1 - exit * 2.4));
      }

      // Card dwell: q = i + easeInOut(frac), d = q - i
      // 3 cards spanning p in [0, 1]
      const totalCards = PROJECTS.length;
      const rawQ = p * (totalCards - 1);
      const activeIdx = Math.min(totalCards - 1, Math.floor(rawQ));
      const frac = rawQ - activeIdx;
      // easeInOut
      const easeFrac = frac < 0.5 ? 2 * frac * frac : -1 + (4 - 2 * frac) * frac;
      const q = activeIdx + easeFrac;

      // Update counter and progress bar
      const displayIdx = Math.min(totalCards - 1, Math.max(0, Math.round(rawQ)));
      if (counterRef.current) {
        counterRef.current.textContent = String(displayIdx + 1).padStart(2, '0');
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(p * 100).toFixed(1)}%`;
      }

      // 3D Card transformations
      PROJECTS.forEach((_, i) => {
        const card = cardsRef.current[i];
        if (!card) return;
        const d = q - i;

        if (d >= 0) {
          // Card is active or leaving: z = d * 900, y = -12d vh, rotateX = 28d, opacity = 1 - 1.8d
          const clampD = Math.min(d, 1.2);
          const z = clampD * 900;
          const yVh = -12 * clampD;
          const rotX = 28 * clampD;
          const opacity = Math.max(0, 1 - 1.8 * clampD);
          card.style.transform = `translate3d(0, ${yVh}vh, ${z}px) rotateX(${rotX}deg)`;
          card.style.opacity = String(opacity);
          card.style.pointerEvents = clampD < 0.3 ? 'auto' : 'none';
        } else {
          // Card is upcoming: d is negative, z = d * 300, y = d * 3.2vh, fading
          const upD = -d; // positive distance from current
          const z = -upD * 300;
          const yVh = upD * 3.2;
          const opacity = Math.max(0, 1 - upD * 0.7);
          card.style.transform = `translate3d(0, ${yVh}vh, ${z}px) rotateX(0deg)`;
          card.style.opacity = String(opacity);
          card.style.pointerEvents = 'none';
        }
      });
    });

    return unsub;
  }, []);

  return (
    <section
      ref={sectionRef}
      id="work"
      className="section"
      style={{ height: '460vh' }}
    >
      <div className="section-inner" style={{ overflow: 'hidden' }}>
        {/* Header: Label, Anton counter "01 / 03", 140px progress bar */}
        <div
          className="work-header"
          style={{
            position: 'absolute',
            left: '5vw',
            top: '12vh',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            zIndex: 10,
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: 0 }}>
              <span className="label-num">03</span> — Selected Work
            </div>
          </div>

          <div
            className="work-counter"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
            }}
          >
            <span ref={counterRef} style={{ color: 'var(--red)' }}>
              01
            </span>
            <span style={{ color: 'var(--mute)', fontSize: '18px' }}>/</span>
            <span style={{ color: 'var(--mute)', fontSize: '18px' }}>
              {String(PROJECTS.length).padStart(2, '0')}
            </span>
          </div>

          <div
            className="work-progress-bar-wrap"
            style={{
              width: '140px',
              height: '2px',
              background: 'var(--line)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              ref={progressBarRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '0%',
                background: 'var(--red)',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>

        {/* 3D Deck: compact left card deck so laptop is 100% visible on right */}
        <div
          className="work-deck"
          style={{
            position: 'absolute',
            left: 'clamp(24px, 4.5vw, 64px)',
            top: '22vh',
            width: 'clamp(340px, 39vw, 560px)',
            height: '56vh',
            perspective: '1500px',
            perspectiveOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
            zIndex: 10,
          }}
        >
          {PROJECTS.map((proj, i) => {
            const VisualComp = VISUALS[i % VISUALS.length];
            return (
              <div
                key={proj.num}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="work-card"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--paper)',
                  borderRadius: '30px',
                  boxShadow: '0 24px 60px rgba(13, 13, 13, 0.08), 0 1px 3px rgba(13, 13, 13, 0.04)',
                  border: '1px solid var(--line)',
                  display: 'grid',
                  gridTemplateColumns: '1.15fr 1fr',
                  overflow: 'hidden',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                }}
              >
                {/* Left Column */}
                <div
                  style={{
                    padding: 'clamp(20px, 2.4vw, 36px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--mute)',
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                        {proj.num}
                      </span>
                      <span>·</span>
                      <span>{proj.cat}</span>
                    </div>

                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(28px, 3.2vw, 54px)',
                        lineHeight: 0.92,
                        textTransform: 'uppercase',
                        color: 'var(--ink)',
                        marginBottom: '1rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {proj.name}
                    </h3>

                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'clamp(13px, 1.05vw, 15px)',
                        color: 'var(--mute)',
                        lineHeight: 1.45,
                        maxWidth: '26em',
                        marginBottom: '1.2rem',
                      }}
                    >
                      {proj.desc}
                    </p>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '1.5rem',
                      }}
                    >
                      {proj.chips.map((chip, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            background: 'rgba(13, 13, 13, 0.05)',
                            color: 'var(--ink)',
                          }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <a
                      href={proj.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="work-link"
                      data-cursor="Open"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--red)',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      View on GitHub ↗
                    </a>
                  </div>
                </div>

                {/* Right Visual Column (Red Panel) */}
                <div
                  style={{
                    background: 'var(--red)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <VisualComp />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
