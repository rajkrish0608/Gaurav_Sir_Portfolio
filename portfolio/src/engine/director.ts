import Lenis from 'lenis';
import gsap from 'gsap';

export interface SceneDef {
  id: string;
  label: string;
  from: number;
  to: number;
  x: number;
  k: number;
}

export const SCENES: SceneDef[] = [
  { id: 'hero',    label: 'Hello',   from:  0, to: 59,  x: 0.70, k: 1.00 },
  { id: 'about',   label: 'About',   from: 60, to: 118, x: 0.27, k: 1.00 },
  { id: 'work',    label: 'Work',    from:119, to: 191, x: 0.81, k: 0.86 },
  { id: 'journey', label: 'Journey', from:192, to: 220, x: 0.26, k: 1.00 },
  { id: 'skills',  label: 'Toolkit', from:221, to: 232, x: 0.50, k: 0.98 },
  { id: 'awards',  label: 'Awards',  from:233, to: 239, x: 0.75, k: 1.00 },
  { id: 'contact', label: 'Contact', from: 59, to:  0,  x: 0.50, k: 1.00 },
];

export interface SceneState {
  id: string;
  enter: number;
  p: number;
  exit: number;
  vis: number;
  frame: number;
  t: number;  // blade transition 0→1
}

type Subscriber = (states: SceneState[], y: number, contactBlade: number) => void;
const subs: Subscriber[] = [];
export function subscribe(fn: Subscriber) { subs.push(fn); return () => { const i = subs.indexOf(fn); if(i>-1) subs.splice(i,1); }; }

// Section rects — filled by ResizeObserver from sections
interface SectionRect { top: number; height: number; }
const rects: SectionRect[] = SCENES.map(() => ({ top: 0, height: 0 }));
export function setRect(idx: number, top: number, height: number) {
  rects[idx] = { top, height };
}
export function getRects() { return rects; }

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
function easeInOutSine(t: number) { return -(Math.cos(Math.PI * t) - 1) / 2; }

let scrollY = 0;
let vh = window.innerHeight;
let lenis: Lenis | null = null;
let started = false;

const LEAD = 0.78;
const SPAN = 0.62;

export function getScrollY() { return scrollY; }
export function getVH() { return vh; }

export function initDirector() {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  vh = window.innerHeight;
  window.addEventListener('resize', () => { vh = window.innerHeight; });

  lenis = new Lenis({
    lerp: 0.075,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  } as any);
  lenis.stop();

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((t) => { lenis?.raf(t * 1000); });

  lenis.on('scroll', ({ scroll }: { scroll: number }) => {
    scrollY = scroll;
    tick();
  });

  (window as any).__lenis = lenis;
  (window as any).__tick = tick;
}

export function startScroll() {
  started = true;
  lenis?.start();
}

export function scrollToScene(idx: number) {
  if (!lenis || !started) return;
  const r = rects[idx];
  lenis.scrollTo(r.top, { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
}

function tick() {
  const y = scrollY;
  const states: SceneState[] = [];

  for (let i = 0; i < SCENES.length; i++) {
    const sc = SCENES[i];
    const { top, height: h } = rects[i];
    const enter = clamp((y - (top - vh)) / vh);
    const p     = clamp((y - top) / Math.max(h - vh, 1));
    const exit  = clamp((y - (top + h - vh)) / vh);
    const vis   = clamp(Math.min(enter * 1.6, 1 - exit * 2.2));
    const frame = sc.from + (sc.to - sc.from) * p;

    // Blade transition
    const tRaw = (y - (top - LEAD * vh)) / (SPAN * vh);
    const t = easeInOutSine(clamp(tRaw));

    states.push({ id: sc.id, enter, p, exit, vis, frame, t });
  }

  // Contact blade progress for HUD colour switch
  const contactState = states[6];
  const contactBlade = contactState.t;

  subs.forEach(fn => fn(states, y, contactBlade));
}

export { lenis };
