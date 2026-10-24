import { useEffect, useState } from 'react';
import { SCENES, scrollToScene } from '../engine/director';
import { useScroll } from '../engine/hooks';
import { DATA } from '../data';

export default function Chrome({ contactBlade }: { contactBlade: number }) {
  const contactMode = contactBlade > 0.6;
  const { states, scrollY } = useScroll();
  const [totalPct, setTotalPct] = useState(0);

  // Active scene = highest vis
  const activeIdx = states.reduce(
    (best, s, i) => (s.vis > (states[best]?.vis ?? 0) ? i : best),
    0
  );

  useEffect(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((scrollY / maxScroll) * 100)));
      setTotalPct(pct);
    }
  }, [scrollY]);

  return (
    <>
      {/* HUD left: First name logo in Anton 28px with red ® */}
      <div className={`hud-logo ${contactMode ? 'contact-mode' : ''}`}>
        {DATA.name.first}
        <span className="logo-reg">®</span>
      </div>

      {/* HUD right: pill nav (white 62% blur, active has red fill, contact turns white) */}
      <nav className={`hud-nav ${contactMode ? 'contact-mode' : ''}`}>
        {SCENES.map((sc, i) => (
          <button
            key={sc.id}
            className={`nav-pill ${activeIdx === i ? 'active' : ''} ${
              contactMode ? 'contact-mode' : ''
            }`}
            onClick={() => scrollToScene(i)}
            data-cursor="Go"
          >
            {sc.label}
          </button>
        ))}
      </nav>

      {/* Bottom-right: mono progress % and 2px red vertical rail */}
      <div className={`progress-rail ${contactMode ? 'contact-mode' : ''}`}>
        <span className="progress-pct">{String(totalPct).padStart(3, '0')}%</span>
        <div className="rail-track">
          <div className="rail-fill" style={{ height: `${totalPct}%` }} />
        </div>
      </div>
    </>
  );
}
