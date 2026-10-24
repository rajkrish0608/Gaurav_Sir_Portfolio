import { useEffect, useRef } from 'react';
import { setRect, subscribe, scrollToScene } from '../engine/director';
import { DATA } from '../data';

const SECTION_IDX = 6;

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
      const { enter, exit } = state;

      // Foreground content fade and rise
      if (contentRef.current) {
        const inP = Math.min(enter * 2.2, 1);
        const outP = Math.max(0, 1 - exit * 2.4);
        contentRef.current.style.opacity = String(inP * outP);
      }
    });

    return unsub;
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="section"
      style={{ height: '240vh' }}
    >
      <div className="section-inner" style={{ overflow: 'hidden' }}>
        {/* Foreground Content */}
        <div
          ref={contentRef}
          className="contact-foreground"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 5vw 4vh 5vw',
            pointerEvents: 'none',
          }}
        >
          {/* Main Row: Bottom-Left Email & Bottom-Right Links */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '40px',
              marginBottom: '3rem',
              pointerEvents: 'auto',
            }}
          >
            {/* Bottom-left: Email in Anton clamp(34px, 3.7vw, 74px), split over two lines */}
            <div className="contact-email-wrap">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  opacity: 0.8,
                  marginBottom: '10px',
                }}
              >
                (07) — Direct Line
              </div>

              <a
                href={`mailto:${DATA.contact.email}`}
                className="contact-email-link"
                data-cursor="Write"
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(34px, 3.7vw, 74px)',
                  lineHeight: 0.92,
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  position: 'relative',
                  paddingBottom: '8px',
                }}
              >
                <div>{DATA.contact.emailName}</div>
                <div style={{ color: 'var(--ink)' }}>{DATA.contact.emailDomain}</div>
                <span className="email-wipe-line" />
              </a>
            </div>

            {/* Bottom-right: Stacked list of links with hairline separators and rotating ↗ */}
            <div
              className="contact-links-block"
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: '220px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  opacity: 0.8,
                  marginBottom: '12px',
                }}
              >
                NETWORK &amp; ASSETS
              </div>

              <a
                href={DATA.contact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-stacked-link"
                data-cursor="Open"
              >
                <span>GitHub</span>
                <span className="link-arrow">↗</span>
              </a>

              <div className="contact-hairline" />

              <a
                href={DATA.contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-stacked-link"
                data-cursor="Open"
              >
                <span>LinkedIn</span>
                <span className="link-arrow">↗</span>
              </a>

              <div className="contact-hairline" />

              <a
                href={DATA.contact.resume}
                download
                className="contact-stacked-link"
                data-cursor="PDF"
              >
                <span>Download Résumé</span>
                <span className="link-arrow">↗</span>
              </a>
            </div>
          </div>

          {/* Footer: © year and full name, and "Back to top ↑". No phone number. */}
          <footer
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.8)',
              pointerEvents: 'auto',
            }}
          >
            <span>{DATA.footer.copy}</span>
            <button
              onClick={() => scrollToScene(0)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Back to top ↑
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
