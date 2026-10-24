import { useEffect, useRef } from 'react';
import { subscribe, SceneState } from '../engine/director';
import { DATA } from '../data';

const START_YEAR = 2009;
const END_YEAR = 2013;

export default function BackLayer() {
  const heroLettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const heroNameWrapRef = useRef<HTMLDivElement>(null);
  const aboutShadeRef = useRef<HTMLDivElement>(null);
  const workGridRef = useRef<HTMLDivElement>(null);
  const journeyYearRef = useRef<HTMLDivElement>(null);
  const contactBgRef = useRef<HTMLDivElement>(null);
  const contactTitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero intro animation
    const letters = heroLettersRef.current;
    letters.forEach((el, i) => {
      if (!el) return;
      el.style.display = 'inline-block';
      el.style.transform = 'translateY(115%) rotateX(-80deg)';
      el.style.opacity = '0';
      el.style.transition = `transform 1.6s cubic-bezier(0.19, 1, 0.22, 1) ${i * 0.07}s, opacity 1.6s ease ${i * 0.07}s`;
    });

    const timer = setTimeout(() => {
      letters.forEach((el) => {
        if (!el) return;
        el.style.transform = 'translateY(0%) rotateX(0deg)';
        el.style.opacity = '1';
      });
    }, 250);

    const unsub = subscribe((states, scrollY) => {
      // 1. HERO (index 0)
      if (states[0]) {
        const { exit, p } = states[0];
        const heroOpacity = Math.max(0, 1 - exit * 2.4);
        if (heroNameWrapRef.current) {
          heroNameWrapRef.current.style.opacity = String(heroOpacity);
        }
        // Tiny alternating vertical parallax
        letters.forEach((el, i) => {
          if (!el) return;
          const dir = i % 2 === 0 ? 1 : -1;
          const py = p * 40 * dir;
          el.style.transform = `translateY(${py}px)`;
        });
      }

      // 2. ABOUT (index 1)
      if (states[1] && aboutShadeRef.current) {
        const { enter, exit } = states[1];
        const inP = Math.min(enter * 1.8, 1);
        const outP = Math.max(0, 1 - exit * 2.4);
        const opacity = inP * outP;
        const tx = (1 - inP) * -8; // slides in from left
        aboutShadeRef.current.style.opacity = String(opacity);
        aboutShadeRef.current.style.transform = `translateX(${tx}vw)`;
      }

      // 3. WORK (index 2)
      if (states[2] && workGridRef.current) {
        const { vis, p } = states[2];
        workGridRef.current.style.opacity = String(vis);
        // Grid lines move with scroll
        workGridRef.current.style.backgroundPositionY = `${p * 360}px`;
      }

      // 4. JOURNEY (index 3)
      if (states[3] && journeyYearRef.current) {
        const { vis, p } = states[3];
        journeyYearRef.current.style.opacity = String(vis);
        const currentYear = Math.round(START_YEAR + (END_YEAR - START_YEAR) * p);
        journeyYearRef.current.textContent = String(currentYear);
      }

      // 5. CONTACT (index 6)
      if (states[6]) {
        const { enter, exit, t } = states[6];
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const skew = 0.2 * vh;
        const e = -skew + (vw + 2 * skew) * t;

        // Contact red background
        if (contactBgRef.current) {
          if (t > 0.005) {
            contactBgRef.current.style.clipPath = `polygon(0 0, ${e + skew}px 0, ${e - skew}px 100%, 0 100%)`;
            contactBgRef.current.style.opacity = '1';
          } else {
            contactBgRef.current.style.clipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
            contactBgRef.current.style.opacity = '0';
          }
        }

        // Contact giant white title
        if (contactTitleRef.current) {
          const inP = Math.min(enter * 2.0, 1);
          const outP = Math.max(0, 1 - exit * 2.4);
          const titleOpacity = inP * outP;
          const ty = (1 - inP) * 50;
          contactTitleRef.current.style.opacity = String(titleOpacity);
          contactTitleRef.current.style.transform = `translateY(${ty}px)`;
        }
      }
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const heroName = DATA.name.first; // "GAURAV"

  return (
    <div
      className="layer-back"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* HERO: Giant red first name behind head */}
      <div
        ref={heroNameWrapRef}
        className="hero-back-name"
        style={{
          position: 'absolute',
          top: '10.5vh',
          right: '3vw',
          fontFamily: 'var(--font-display)',
          fontSize: 'min(18.5vw, 36vh)',
          lineHeight: 0.86,
          color: 'var(--red)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          userSelect: 'none',
          perspective: 1000,
          opacity: 1,
          transition: 'opacity 0.2s linear',
        }}
        aria-hidden="true"
      >
        {heroName.split('').map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              heroLettersRef.current[i] = el;
            }}
            style={{ display: 'inline-block', transformOrigin: '50% 100%' }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* ABOUT: Soft red shade gradient wash */}
      <div
        ref={aboutShadeRef}
        className="about-back-shade"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(60vw 90vh at 22vw 70vh, rgba(255, 31, 31, 0.30), rgba(255, 31, 31, 0.10) 55%, transparent 80%),
            linear-gradient(90deg, rgba(255, 31, 31, 0.08) 0%, transparent 60%)
          `,
          opacity: 0,
          transition: 'opacity 0.2s linear',
        }}
        aria-hidden="true"
      />

      {/* WORK: Perspective grid floor */}
      <div
        ref={workGridRef}
        className="work-back-grid"
        style={{
          position: 'absolute',
          bottom: '-20vh',
          left: '-20vw',
          width: '140vw',
          height: '90vh',
          backgroundImage: `
            linear-gradient(rgba(255, 31, 31, 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 31, 31, 0.35) 1px, transparent 1px)
          `,
          backgroundSize: '90px 90px',
          transform: 'perspective(600px) rotateX(68deg)',
          transformOrigin: '50% 100%',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 85%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 85%)',
          opacity: 0,
          transition: 'opacity 0.2s linear',
        }}
        aria-hidden="true"
      />

      {/* JOURNEY: Colossal outlined rolling year (2009 -> 2013) */}
      <div
        ref={journeyYearRef}
        className="journey-back-year"
        style={{
          position: 'absolute',
          top: '50%',
          left: '12vw',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--font-display)',
          fontSize: '44vh',
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '2px var(--red)',
          userSelect: 'none',
          opacity: 0,
          transition: 'opacity 0.2s linear',
        }}
        aria-hidden="true"
      >
        {START_YEAR}
      </div>

      {/* SKILLS BACK: chips with z < 0 container */}
      <div
        id="skills-orbit-back"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />

      {/* CONTACT: Red background blade */}
      <div
        ref={contactBgRef}
        className="contact-back-red"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--red)',
          opacity: 0,
          clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
          transition: 'opacity 0.2s linear',
        }}
        aria-hidden="true"
      />

      {/* CONTACT: Giant white "LET'S TALK" behind person */}
      <div
        ref={contactTitleRef}
        className="contact-back-title"
        style={{
          position: 'absolute',
          top: '10vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 'min(36vh, 26vw)',
          lineHeight: 0.84,
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          userSelect: 'none',
          opacity: 0,
          transition: 'opacity 0.2s linear',
        }}
        aria-hidden="true"
      >
        <div>LET'S</div>
        <div>TALK</div>
      </div>
    </div>
  );
}
