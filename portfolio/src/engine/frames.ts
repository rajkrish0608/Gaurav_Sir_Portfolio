export interface FrameManifest {
  w: number;
  h: number;
  count: number;
  shots: Array<{ from: number; to: number; box: [number, number, number, number]; cx: number }>;
}

export const IMAGES: Map<number, HTMLImageElement> = new Map();
let manifest: FrameManifest | null = null;
let loadedCount = 0;
let totalCount = 0;
type ProgressCb = (loaded: number, total: number) => void;
type ReadyCb = () => void;
const progressCbs: ProgressCb[] = [];
const readyCbs: ReadyCb[] = [];

export function onProgress(fn: ProgressCb) { progressCbs.push(fn); }
export function onFirstQuarterReady(fn: ReadyCb) { readyCbs.push(fn); }
export function getManifest() { return manifest; }
export function getLoadedCount() { return loadedCount; }

function notify() { progressCbs.forEach(fn => fn(loadedCount, totalCount)); }

function isMobile() { return window.innerWidth < 820; }

const FRAME_VERSION = 'v=20261024_4';

async function loadFrame(idx: number, baseUrl: string): Promise<void> {
  if (IMAGES.has(idx)) return;
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.src = `${baseUrl}/f${String(idx).padStart(3, '0')}.webp?${FRAME_VERSION}`;
    img.decode().then(() => {
      IMAGES.set(idx, img);
      loadedCount++;
      notify();
      resolve();
    }).catch(() => resolve());
  });
}

function nearestLoaded(idx: number, shotFrom: number, shotTo: number): HTMLImageElement | null {
  // Search outward from idx within the shot
  const lo = Math.min(shotFrom, shotTo);
  const hi = Math.max(shotFrom, shotTo);
  for (let d = 0; d <= hi - lo; d++) {
    if (IMAGES.has(idx - d) && idx - d >= lo) return IMAGES.get(idx - d)!;
    if (IMAGES.has(idx + d) && idx + d <= hi) return IMAGES.get(idx + d)!;
  }
  return null;
}

export function getFrame(f: number): { img: HTMLImageElement | null; next: HTMLImageElement | null; frac: number } {
  if (!manifest) return { img: null, next: null, frac: 0 };
  const floor = Math.floor(f);
  const frac = f - floor;
  // Find shot
  let shot = manifest.shots[0];
  for (const s of manifest.shots) {
    const lo = Math.min(s.from, s.to);
    const hi = Math.max(s.from, s.to);
    if (floor >= lo && floor <= hi) { shot = s; break; }
  }
  const lo = Math.min(shot.from, shot.to);
  const hi = Math.max(shot.from, shot.to);
  const img = IMAGES.get(floor) ?? nearestLoaded(floor, lo, hi);
  const next = (floor + 1 <= hi) ? (IMAGES.get(floor + 1) ?? img) : img;
  return { img, next, frac };
}

export async function loadFrames() {
  try {
    const res = await fetch(`./frames/manifest.json?${FRAME_VERSION}`);
    manifest = await res.json() as FrameManifest;
  } catch {
    // Build fallback manifest from portrait image
    manifest = {
      w: 1600, h: 900, count: 1,
      shots: [{ from: 0, to: 0, box: [0, 0, 800, 900], cx: 0.5 }]
    };
    // Load portrait as single frame
    const img = new Image();
    img.src = './portrait.png';
    await img.decode().catch(() => {});
    IMAGES.set(0, img);
    loadedCount = 1;
    totalCount = 1;
    notify();
    readyCbs.forEach(fn => fn());
    return;
  }

  const base = isMobile() ? './frames/sm' : './frames/lg';
  totalCount = manifest.count;

  // Build stride load order: boundaries first, then 8→4→2→1
  const allIdxs: number[] = [];
  for (let i = 0; i < totalCount; i++) allIdxs.push(i);

  // Shot boundaries first
  const boundaries = manifest.shots.flatMap(s => [s.from, s.to]);
  const rest = allIdxs.filter(i => !boundaries.includes(i));

  // Stride order for rest
  const strides = [8, 4, 2, 1];
  const ordered: number[] = [...boundaries];
  for (const stride of strides) {
    for (let i = 0; i < rest.length; i += stride) {
      if (!ordered.includes(rest[i])) ordered.push(rest[i]);
    }
  }

  // Load first quarter then signal ready, stream the rest
  const quarter = Math.ceil(totalCount / 4);
  const firstBatch = ordered.slice(0, quarter);
  const restBatch = ordered.slice(quarter);

  await Promise.all(firstBatch.map(i => loadFrame(i, base)));
  readyCbs.forEach(fn => fn());

  // Stream rest in background with concurrent pool
  (async () => {
    const poolSize = 8;
    let queueIdx = 0;
    const worker = async () => {
      while (queueIdx < restBatch.length) {
        const idx = restBatch[queueIdx++];
        await loadFrame(idx, base);
      }
    };
    await Promise.all(Array.from({ length: poolSize }, worker));
  })();
}
