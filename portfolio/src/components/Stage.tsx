import { useEffect, useRef } from 'react';
import { subscribe, SCENES, SceneState, getScrollY, getRects } from '../engine/director';
import { getFrame, getManifest, getLoadedCount, IMAGES } from '../engine/frames';

const PARALLAX = 14;
const MOUSE_LERP = 0.06;

function isMobile() { return window.innerWidth < 820; }

export default function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mx = useRef(0), my = useRef(0);
  const tmx = useRef(0), tmy = useRef(0);
  const rafRef = useRef(0);
  const lastKey = useRef('');
  const statesRef = useRef<SceneState[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', (e) => {
      mx.current = (e.clientX / window.innerWidth - 0.5) * 2;
      my.current = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    const unsub = subscribe((states) => { statesRef.current = states; });

    function findActiveScene(states: SceneState[]): { cur: number; prev: number } {
      const y = getScrollY();
      const vh = window.innerHeight;
      const LEAD = 0.78;
      const rects = getRects();
      let cur = 0;
      for (let i = 0; i < states.length; i++) {
        const top = rects[i]?.top ?? 0;
        if (i === 0 || y >= top - LEAD * vh) {
          cur = i;
        }
      }
      const prev = Math.max(0, cur - 1);
      return { cur, prev };
    }

    function drawScene(
      states: SceneState[],
      vw: number,
      vh: number,
      dprLocal: number
    ) {
      const manifest = getManifest();
      if (!manifest) return;

      const { cur, prev } = findActiveScene(states);
      const curState = states[cur];
      const prevState = states[prev];
      const mobile = isMobile();

      // Lerp mouse parallax
      tmx.current += (mx.current - tmx.current) * MOUSE_LERP;
      tmy.current += (my.current - tmy.current) * MOUSE_LERP;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sc = SCENES[cur];
      const scPrev = SCENES[prev];

      // Get current shot info
      const shot = manifest.shots.find(s => {
        const lo = Math.min(s.from, s.to), hi = Math.max(s.from, s.to);
        return Math.floor(curState.frame) >= lo && Math.floor(curState.frame) <= hi;
      }) ?? manifest.shots[0];

      const shotPrev = manifest.shots.find(s => {
        const lo = Math.min(s.from, s.to), hi = Math.max(s.from, s.to);
        return Math.floor(prevState.frame) >= lo && Math.floor(prevState.frame) <= hi;
      }) ?? manifest.shots[0];

      const [bx, by, bw, bh] = shot.box;
      const [pbx, pby, pbw, pbh] = shotPrev.box;
      const cx = shot.cx;
      const pcx = shotPrev.cx;

      // Scale
      const sceneX = mobile ? 0.5 : (vw < 1280 && sc.id === 'work' ? 0.83 : sc.x);
      const sceneXPrev = mobile ? 0.5 : (vw < 1280 && scPrev.id === 'work' ? 0.83 : scPrev.x);

      let scale: number, scalePrev: number;
      if (mobile) {
        scale = Math.min(vh * 0.74 / 900, vw * 1.05 / bw);
        scalePrev = Math.min(vh * 0.74 / 900, vw * 1.05 / pbw);
      } else {
        scale = vh * sc.k / 900;
        scalePrev = vh * scPrev.k / 900;
      }

      const offY = vh - 900 * scale;
      const offX = sceneX * vw - cx * 1600 * scale;
      const pOffY = vh - 900 * scalePrev;
      const pOffX = sceneXPrev * vw - pcx * 1600 * scalePrev;

      const px = tmx.current * PARALLAX;
      const py = tmy.current * PARALLAX;

      const t = curState.t;
      const isContact = sc.id === 'contact';

      // Blade geometry
      const skew = 0.2 * vh;
      const e = -skew + (vw + 2 * skew) * t;

      function drawShot(
        frame: number,
        boxArr: [number, number, number, number],
        s: number,
        ox: number,
        oy: number,
        alpha: number,
        shiftX: number
      ) {
        const { img, next, frac } = getFrame(frame);
        if (!img) return;
        const [bxL, byL, bwL, bhL] = boxArr;
        const dx = (ox + bxL * s + px + shiftX) * dprLocal;
        const dy = (oy + byL * s + py) * dprLocal;
        const dw = bwL * s * dprLocal;
        const dh = bhL * s * dprLocal;

        ctx.globalAlpha = alpha;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
        if (next && next !== img && frac > 0.01) {
          ctx.globalAlpha = alpha * frac;
          ctx.drawImage(next, 0, 0, next.naturalWidth, next.naturalHeight, dx, dy, dw, dh);
        }
        ctx.globalAlpha = 1;
      }

      // When t < 0.01 no blade — draw current directly
      if (t < 0.01) {
        drawShot(curState.frame, [bx, by, bw, bh] as [number,number,number,number], scale, offX, offY, 1, 0);
        return;
      }
      if (t > 0.99) {
        drawShot(curState.frame, [bx, by, bw, bh] as [number,number,number,number], scale, offX, offY, 1, 0);
        return;
      }

      // Outgoing (prev): clipped to right of blade line, shift +60t px, alpha 1-0.35t
      ctx.save();
      ctx.beginPath();
      ctx.moveTo((e + skew) * dprLocal, 0);
      ctx.lineTo((e - skew) * dprLocal, canvas.height);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(canvas.width, 0);
      ctx.closePath();
      ctx.clip();
      drawShot(scPrev.to, [pbx, pby, pbw, pbh] as [number,number,number,number], scalePrev, pOffX, pOffY, 1 - 0.35 * t, 60 * t);
      ctx.restore();

      // Incoming (cur): clipped to left of blade line, shift -60(1-t) px
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, canvas.height);
      ctx.lineTo((e - skew) * dprLocal, canvas.height);
      ctx.lineTo((e + skew) * dprLocal, 0);
      ctx.closePath();
      ctx.clip();
      drawShot(sc.from, [bx, by, bw, bh] as [number,number,number,number], scale, offX, offY, 1, -60 * (1 - t));
      ctx.restore();

      // Blade line
      const bladeColor = isContact ? '#ffffff' : '#ff1f1f';
      ctx.save();
      // Trail gradient
      const gradX1 = (e - skew) * dprLocal;
      const gradX2 = (e + skew) * dprLocal;
      const grad = ctx.createLinearGradient(gradX1 - 90 * dprLocal, 0, gradX2, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, bladeColor + '66');
      ctx.fillStyle = grad;
      ctx.fillRect((e - 90 - skew) * dprLocal, 0, 90 * dprLocal, canvas.height);

      // Glow
      ctx.shadowColor = bladeColor;
      ctx.shadowBlur = 24 * dprLocal;
      ctx.strokeStyle = bladeColor;
      ctx.lineWidth = 3 * dprLocal;
      ctx.beginPath();
      ctx.moveTo((e + skew) * dprLocal, 0);
      ctx.lineTo((e - skew) * dprLocal, canvas.height);
      ctx.stroke();
      ctx.restore();
    }

    function loop() {
      const states = statesRef.current;
      if (states.length === 0) { rafRef.current = requestAnimationFrame(loop); return; }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const loaded = getLoadedCount();
      const y = getScrollY();
      const fList = states.map(s => s.frame.toFixed(2)).join(',');
      const tList = states.map(s => s.t.toFixed(3)).join(',');
      const key = `${fList}:${tList}:${y.toFixed(0)}:${loaded}:${vw}:${vh}:${Math.round(tmx.current * 20)}:${Math.round(tmy.current * 20)}`;
      if (key !== lastKey.current) {
        lastKey.current = key;
        drawScene(states, vw, vh, dpr);
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      unsub();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 1,
        pointerEvents: 'none', width: '100%', height: '100%',
      }}
    />
  );
}
