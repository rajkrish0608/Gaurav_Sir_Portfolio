import { useEffect, useRef, useState } from 'react';
import { subscribe, SceneState } from './director';

export function useScroll() {
  const [states, setStates] = useState<SceneState[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [contactBlade, setContactBlade] = useState(0);

  useEffect(() => {
    return subscribe((s, y, cb) => {
      setStates([...s]);
      setScrollY(y);
      setContactBlade(cb);
    });
  }, []);

  return { states, scrollY, contactBlade };
}

export function useScene(idx: number) {
  const ref = useRef<SceneState | null>(null);
  useEffect(() => {
    return subscribe((states) => {
      ref.current = states[idx] ?? null;
    });
  }, [idx]);
  return ref;
}

export function useMouse() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return mouse;
}
