import { useEffect, useRef } from 'react';
import { setRect, subscribe } from '../engine/director';
import { DATA } from '../data';

const SECTION_IDX = 0;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const underlineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleLinesRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current!;
    const ro = new ResizeObserver(() => {
      setRect(SECTION_IDX, section.offsetTop, section.offsetHeight);
    });
    ro.observe(section);
    setRect(SECTION_IDX, section.offsetTop, section.offsetHeight);

    // Intro line slide up
    titleLinesRef.current.forEach((el, i) => {
      if (!el) return;
      el.style.display = 'inline-block';
      el.style.transform = 'translateY(115%)';
      el.style.transition = `transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.12}s`;
    });

    const timer = setTimeout(() => {
      titleLinesRef.current.forEach((el) => {
        if (!el) return;
        el.style.transform = 'translateY(0%)';
      });
    }, 200);

    const unsub = subscribe((states) => {
      const state = states[SECTION_IDX];
      if (!state) return;
      const { p, exit } = state;

      // Scroll-driven highlighter underline
      if (underlineRef.current) {
        underlineRef.current.style.width = `${p * 100}%`;
      }

      // Exit fade
      if (contentRef.current) {
        contentRef.current.style.opacity = String(Math.max(0, 1 - exit * 2.4));
      }
    });

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      unsub();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="section"
      style={{ height: '230vh' }}
    >
      <div className="section-inner" style={{ overflow: 'hidden' }}>
        {/* Front Left Column */}
        <div
          ref={contentRef}
          className="hero-content"
          style={{
            position: 'absolute',
            left: '5vw',
            top: '26vh',
            width: 'min(47vw, 780px)',
            zIndex: 10,
            transition: 'opacity 0.2s linear',
          }}
        >
          <p
            className="hero-greeting"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(14px, 1.1vw, 18px)',
              color: 'var(--mute)',
              marginBottom: '1rem',
              letterSpacing: '0.02em',
            }}
          >
            Hi, I'm <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{DATA.name.full}</span> —
          </p>

          <h1
            className="hero-title"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(56px, 7.6vw, 156px)',
              lineHeight: 0.88,
              textTransform: 'uppercase',
              marginBottom: '2rem',
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span ref={(el) => { titleLinesRef.current[0] = el; }}>
                FULL-STACK
              </span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden', color: 'var(--red)' }}>
              <span ref={(el) => { titleLinesRef.current[1] = el; }}>
                DEVELOPER.
              </span>
            </span>
          </h1>

          <p
            className="hero-desc"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(16px, 1.35vw, 23px)',
              fontWeight: 500,
              lineHeight: 1.45,
              color: 'var(--ink)',
              maxWidth: '31em',
              marginBottom: '2.5rem',
            }}
          >
            {DATA.tagline[0]}. Building intelligent systems that{' '}
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                fontWeight: 600,
              }}
            >
              automate, scale, and transform
              <span
                ref={underlineRef}
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: 0,
                  height: '3px',
                  background: 'var(--red)',
                  width: '0%',
                  transition: 'width 0.1s linear',
                }}
              />
            </span>{' '}
            global enterprises.
          </p>

          <div
            className="hero-buttons"
            style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
          >
            <a
              href="#work"
              className="btn btn-red"
              data-cursor="Go"
            >
              <span className="btn-fill" />
              <span className="btn-text">
                <span className="btn-roll">See my work ↘</span>
                <span className="btn-roll">See my work ↘</span>
              </span>
            </a>

            <a
              href={DATA.contact.resume}
              className="btn btn-outline"
              data-cursor="PDF"
              download
            >
              <span className="btn-fill" />
              <span className="btn-text">
                <span className="btn-roll">Download résumé</span>
                <span className="btn-roll">Download résumé</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
