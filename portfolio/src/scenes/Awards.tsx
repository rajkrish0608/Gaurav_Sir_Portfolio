import { useEffect, useRef, useState } from 'react';
import { setRect, subscribe } from '../engine/director';
import { DATA } from '../data';

const SECTION_IDX = 5;
const CERTS = DATA.certifications;
const N = CERTS.length;
const RADIUS = 360;
const TOTAL_ANGLE = 360 - 360 / N;

export default function Awards() {
  const sectionRef = useRef<HTMLElement>(null);
  const cylinderRef = useRef<HTMLDivElement>(null);
  const counterEls = useRef<(HTMLDivElement | null)[]>([]);
  const [triggered, setTriggered] = useState(false);
  const hasTriggered = useRef(false);

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
      const { p, enter, exit } = state;

      // Section exit fade
      if (sectionRef.current) {
        sectionRef.current.style.opacity = String(Math.max(0, 1 - exit * 2.4));
      }

      // Flip-in counter cards: rotateX -100 -> 0, staggered
      DATA.coding.forEach((_, i) => {
        const el = counterEls.current[i];
        if (!el) return;
        const delay = i * 0.12;
        const cardP = Math.max(0, Math.min(1, (enter - delay) * 2.8));
        const rotX = (1 - cardP) * -100;
        el.style.transform = `perspective(800px) rotateX(${rotX}deg)`;
        el.style.opacity = String(cardP);
      });

      // Animated counter values
      if (enter > 0.35 && !hasTriggered.current) {
        hasTriggered.current = true;
        setTriggered(true);
      }

      // Certifications cylinder rotation:
      // container at translateZ(-360px) rotateX(-14deg) rotateY(-p * (360 - 360/N))
      if (cylinderRef.current) {
        const rotY = -p * TOTAL_ANGLE;
        cylinderRef.current.style.transform = `translateZ(-${RADIUS}px) rotateX(-14deg) rotateY(${rotY}deg)`;
      }
    });

    return unsub;
  }, []);

  // Number roll animation on trigger
  useEffect(() => {
    if (!triggered) return;
    counterEls.current.forEach((el, i) => {
      if (!el) return;
      const target = DATA.coding[i].value;
      const suffix = DATA.coding[i].suffix;
      let cur = 0;
      const step = target / 40;
      const iv = setInterval(() => {
        cur = Math.min(cur + step, target);
        const valEl = el.querySelector('.counter-value');
        if (valEl) valEl.textContent = Math.round(cur) + suffix;
        if (cur >= target) clearInterval(iv);
      }, 20);
    });
  }, [triggered]);

  return (
    <section
      ref={sectionRef}
      id="awards"
      className="section"
      style={{ height: '320vh' }}
    >
      <div className="section-inner" style={{ overflow: 'hidden' }}>
        {/* Left column container */}
        <div
          className="awards-content"
          style={{
            position: 'absolute',
            left: '5vw',
            top: '12vh',
            width: 'min(52vw, 840px)',
            zIndex: 10,
          }}
        >
          <div className="section-label">
            <span className="label-num">06</span> — Recognition &amp; Scale
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 5.2vw, 92px)',
              lineHeight: 0.88,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              marginBottom: '2.5rem',
            }}
          >
            PROVEN IMPACT.
            <br />
            <span className="red">ENTERPRISE SCALE.</span>
          </h2>

          {/* 4 Flip-in counter cards in a row, alternating red/black */}
          <div
            className="awards-counters-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px',
              marginBottom: '4rem',
            }}
          >
            {DATA.coding.map((item, i) => {
              const isRed = item.color === 'red';
              return (
                <div
                  key={i}
                  ref={(el) => {
                    counterEls.current[i] = el;
                  }}
                  className="awards-stat-card"
                  style={{
                    background: isRed ? 'var(--red)' : 'var(--ink)',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '20px 16px',
                    boxShadow: isRed
                      ? '0 12px 30px rgba(255, 31, 31, 0.35)'
                      : '0 12px 30px rgba(13, 13, 13, 0.25)',
                    transformOrigin: '50% 0%',
                    willChange: 'transform, opacity',
                  }}
                >
                  <div
                    className="counter-value"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(32px, 3.2vw, 54px)',
                      lineHeight: 1,
                      marginBottom: '6px',
                    }}
                  >
                    00{item.suffix}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      opacity: 0.75,
                    }}
                  >
                    {item.platform}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subheader for certifications */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--mute)',
              marginBottom: '1rem',
            }}
          >
            VERIFIED CERTIFICATIONS &amp; CREDENTIALS
          </div>

          {/* Certifications 3D Cylinder Scene (perspective 1600) */}
          <div
            className="cylinder-viewport"
            style={{
              width: '100%',
              height: '240px',
              perspective: '1600px',
              perspectiveOrigin: '50% 50%',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              ref={cylinderRef}
              className="cylinder-ring"
              style={{
                width: '290px',
                height: '178px',
                position: 'absolute',
                left: 'calc(50% - 145px)',
                top: 'calc(50% - 89px)',
                transformStyle: 'preserve-3d',
                transform: `translateZ(-${RADIUS}px) rotateX(-14deg) rotateY(0deg)`,
                willChange: 'transform',
              }}
            >
              {CERTS.map((cert, i) => {
                const angle = (360 / N) * i;
                const isRed = i % 3 === 2;
                return (
                  <div
                    key={i}
                    className="cert-card-slot"
                    style={{
                      position: 'absolute',
                      width: '290px',
                      height: '178px',
                      transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Front Face */}
                    <div
                      className="cert-face-front"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: isRed ? 'var(--red)' : '#ffffff',
                        color: isRed ? '#ffffff' : 'var(--ink)',
                        borderRadius: '20px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
                        border: isRed ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            opacity: 0.7,
                            marginBottom: '6px',
                          }}
                        >
                          {cert.issuer} · {cert.year}
                        </div>
                        <h4
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '22px',
                            lineHeight: 1.1,
                            textTransform: 'uppercase',
                          }}
                        >
                          {cert.title}
                        </h4>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          OFFICIAL CREDENTIAL
                        </span>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isRed ? '#ffffff' : 'var(--red)',
                            color: isRed ? 'var(--red)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
                      </div>
                    </div>

                    {/* Back Face: light red gradient, rotateY 180, backface-visibility: hidden */}
                    <div
                      className="cert-face-back"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(135deg, rgba(255,31,31,0.12), rgba(255,31,31,0.04))',
                        border: '1px solid rgba(255,31,31,0.25)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--red)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        GS · VERIFIED
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
