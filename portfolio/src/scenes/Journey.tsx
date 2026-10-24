import { useEffect, useRef } from 'react';
import { setRect, subscribe } from '../engine/director';
import { DATA } from '../data';

const SECTION_IDX = 3;
const ITEMS = DATA.journey;

export default function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);

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

      // Section exit fade
      if (sectionRef.current) {
        sectionRef.current.style.opacity = String(Math.max(0, 1 - exit * 2.4));
      }

      // SVG path draws from bottom up: pathLength=1 and dashoffset
      if (pathRef.current) {
        // dashoffset goes from 1 (fully hidden) to 0 (fully drawn) as p goes 0 -> 1
        pathRef.current.style.strokeDashoffset = String(Math.max(0, 1 - p));
      }

      // Timeline items reveal from bottom with rotateY -55deg -> 0
      ITEMS.forEach((_, i) => {
        const itemEl = itemsRef.current[i];
        const nodeEl = nodesRef.current[i];
        if (!itemEl) return;

        // Items are newest at top (index 0 is newest, index 2 is oldest)
        // Reveals from bottom up: index 2 first, then index 1, then index 0
        const itemP = (ITEMS.length - 1 - i) / (ITEMS.length - 1 || 1);
        const threshold = itemP * 0.55;
        const progress = Math.max(0, Math.min(1, (p - threshold) / 0.35));

        const rotY = (1 - progress) * -55;
        itemEl.style.transform = `perspective(1000px) rotateY(${rotY}deg) translateX(${(1 - progress) * 30}px)`;
        itemEl.style.opacity = String(progress);

        if (nodeEl) {
          nodeEl.style.background = progress > 0.6 ? 'var(--red)' : '#ffffff';
          nodeEl.style.borderColor = progress > 0.6 ? 'var(--red)' : 'rgba(13,13,13,0.2)';
          nodeEl.style.boxShadow = progress > 0.6 ? '0 0 16px rgba(255,31,31,0.6)' : 'none';
        }
      });
    });

    return unsub;
  }, []);

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="section"
      style={{ height: '240vh' }}
    >
      <div className="section-inner" style={{ overflow: 'hidden' }}>
        {/* Front Right Column: left: 52vw; top: 14vh; right: 6vw */}
        <div
          className="journey-content"
          style={{
            position: 'absolute',
            left: '52vw',
            top: '14vh',
            right: '6vw',
            zIndex: 10,
          }}
        >
          <div className="section-label">
            <span className="label-num">04</span> — Journey
          </div>

          <h2
            className="journey-title"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 5.2vw, 92px)',
              lineHeight: 0.88,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              marginBottom: '3rem',
            }}
          >
            LEARNING
            <br />
            <span className="red">OUT LOUD.</span>
          </h2>

          <div
            className="journey-timeline"
            style={{
              position: 'relative',
              paddingLeft: '36px',
            }}
          >
            {/* SVG Track & drawing red line */}
            <svg
              style={{
                position: 'absolute',
                top: '10px',
                bottom: '10px',
                left: '7px',
                width: '2px',
                height: 'calc(100% - 20px)',
                overflow: 'visible',
              }}
              viewBox="0 0 2 100"
              preserveAspectRatio="none"
            >
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="100"
                stroke="rgba(13,13,13,0.12)"
                strokeWidth="2"
              />
              <path
                ref={pathRef}
                d="M1 100 L1 0"
                stroke="var(--red)"
                strokeWidth="2"
                fill="none"
                pathLength="1"
                style={{
                  strokeDasharray: '1',
                  strokeDashoffset: '1',
                  transition: 'stroke-dashoffset 0.1s linear',
                }}
              />
            </svg>

            {/* Timeline items: newest at top */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {ITEMS.map((item, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    itemsRef.current[i] = el;
                  }}
                  className="timeline-item"
                  style={{
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.1s linear, opacity 0.1s linear',
                  }}
                >
                  {/* Active node */}
                  <div
                    ref={(el) => {
                      nodesRef.current[i] = el;
                    }}
                    style={{
                      position: 'absolute',
                      left: '-36px',
                      top: '6px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '2px solid rgba(13,13,13,0.2)',
                      transition: 'all 0.3s ease',
                      zIndex: 2,
                    }}
                  />

                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        letterSpacing: '0.04em',
                        color: 'var(--red)',
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {item.year}
                    </span>

                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(24px, 2.2vw, 38px)',
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        color: 'var(--ink)',
                        marginBottom: '4px',
                      }}
                    >
                      {item.title}
                    </h3>

                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--mute)',
                        marginBottom: '8px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item.org}
                    </div>

                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'clamp(14px, 1.1vw, 16px)',
                        color: 'var(--mute)',
                        lineHeight: 1.45,
                        maxWidth: '28em',
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
