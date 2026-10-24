#!/usr/bin/env python3
"""
Frame extractor for Gaurav Saini portfolio.
Extracts video frames, removes background, and generates WebP files.
"""
import os, sys, json, subprocess, shutil
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import binary_opening, binary_dilation, minimum_filter, gaussian_filter

# ── Config ──────────────────────────────────────────────────────────────────
VIDEO_PATH = "Woman_performing_continuous_stud…_1080p_20261024164242.mp4"
FULL_DIR   = "full_frames"
PORTRAIT   = "Polished Executive Portrait.png"
VW, VH     = 1600, 900
BG_COLOR   = 247
DIST_THRESH = 14
DIST_RAMP   = 40
BLOB_MIN    = 4000
DILATE_R    = 4
OPEN_R      = 3
SCENE_THRESH = 0.3
Q_LG, Q_SM  = 80, 78
ALPHA_Q     = 90

def run(cmd, capture=False):
    r = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if not capture: return
    return r.stdout + r.stderr

def extract_full_frames():
    os.makedirs(FULL_DIR, exist_ok=True)
    existing = [f for f in os.listdir(FULL_DIR) if f.endswith('.png')]
    if existing:
        print(f"  Found {len(existing)} existing frames, skipping extraction")
        return sorted(existing)
    print("  Extracting frames with ffmpeg…")
    run(f'ffmpeg -i "{VIDEO_PATH}" -start_number 0 "{FULL_DIR}/f%03d.png" -y -loglevel warning')
    frames = sorted([f for f in os.listdir(FULL_DIR) if f.endswith('.png')])
    print(f"  Extracted {len(frames)} frames")
    return frames

def detect_cuts(frames):
    """Detect shot cuts via scene score from ffmpeg metadata."""
    print("  Detecting shot cuts…")
    meta = run(
        f'ffmpeg -i "{VIDEO_PATH}" -vf "select=gt(scene\\,0.05),metadata=print:file=-" '
        f'-an -f null - 2>&1', capture=True)
    cuts = [0]
    lines = meta.split('\n') if meta else []
    scores = {}
    cur_frame = 0
    for line in lines:
        if 'frame:' in line:
            try: cur_frame = int(line.split('frame:')[1].split()[0])
            except: pass
        if 'lavfi.scene_score=' in line:
            try:
                score = float(line.split('lavfi.scene_score=')[1].strip())
                scores[cur_frame] = score
            except: pass
    n = len(frames)
    # Find peaks above SCENE_THRESH
    if scores:
        sorted_scores = sorted(scores.items(), key=lambda x: -x[1])
        print(f"  Top scene scores: {sorted_scores[:8]}")
        for fr, sc in sorted_scores:
            if sc >= SCENE_THRESH:
                # map ffmpeg filter frame to actual frame index
                if fr < n:
                    cuts.append(fr)
    cuts = sorted(set(cuts))
    cuts.append(n)
    # Merge cuts closer than 20 frames
    merged = [cuts[0]]
    for c in cuts[1:]:
        if c - merged[-1] > 20:
            merged.append(c)
    print(f"  Shot boundaries: {merged}")
    return merged

def person_mask_rembg(img_arr):
    """Use rembg to extract person mask."""
    try:
        from rembg import remove, new_session
        sess = new_session("u2net_human_seg")
        pil = Image.fromarray(img_arr.astype(np.uint8))
        result = remove(pil, session=sess, only_mask=True)
        mask = np.array(result).astype(np.float32) / 255.0
        if mask.ndim == 3:
            mask = mask[:,:,0]
        return mask
    except Exception as e:
        print(f"    rembg error: {e}")
        return np.zeros(img_arr.shape[:2], dtype=np.float32)

def props_mask(img_arr, bg=BG_COLOR, dist_thresh=DIST_THRESH, ramp=DIST_RAMP):
    """Mask props by color distance from background."""
    rgb = img_arr[:,:,:3].astype(np.float32)
    max_dist = np.max(np.abs(rgb - bg), axis=2)
    mask = np.clip((max_dist - dist_thresh) / ramp, 0, 1)
    return mask

def combine_masks(person, props, img_arr):
    """Combine masks, morphology, and refine alpha."""
    # Open person mask
    pmask_bin = (person > 0.5)
    pmask_bin = binary_opening(pmask_bin, iterations=OPEN_R)
    # Retain blobs > BLOB_MIN
    from scipy.ndimage import label
    labeled, num = label(pmask_bin)
    sizes = np.bincount(labeled.ravel())
    sizes[0] = 0
    keep = sizes >= BLOB_MIN
    pmask_bin = keep[labeled]
    # Dilate
    pmask_bin = binary_dilation(pmask_bin, iterations=DILATE_R)
    person_f = pmask_bin.astype(np.float32)
    # props mask morphology
    props_bin = (props > 0.5)
    props_bin = binary_opening(props_bin, iterations=OPEN_R)
    labeled2, num2 = label(props_bin)
    sizes2 = np.bincount(labeled2.ravel())
    sizes2[0] = 0
    keep2 = sizes2 >= BLOB_MIN
    props_bin = keep2[labeled2]
    props_bin = binary_dilation(props_bin, iterations=DILATE_R)
    props_f = props_bin.astype(np.float32)
    # Combine
    alpha = np.maximum(person_f, props_f)
    # Gaussian blur
    alpha = gaussian_filter(alpha, sigma=0.8)
    # Un-premultiply white fringe
    rgb = img_arr[:,:,:3].astype(np.float32)
    a_safe = np.where(alpha > 0.05, alpha, 1.0)
    rgb_corr = (rgb - (1 - alpha[:,:,None]) * BG_COLOR) / a_safe[:,:,None]
    rgb_corr = np.clip(rgb_corr, 0, 255)
    # Alpha erosion: 0.35*alpha + 0.65*MinFilter
    min_a = minimum_filter(alpha, size=3)
    alpha = 0.35 * alpha + 0.65 * min_a
    # Remap
    alpha = np.clip((alpha - 0.14) / 0.86, 0, 1) ** 1.4
    # Edge darkening
    lum = 0.2126 * rgb[:,:,0] + 0.7152 * rgb[:,:,1] + 0.0722 * rgb[:,:,2]
    edge_mask = (alpha < 0.95)
    dark = np.clip((lum - 150) / 70, 0, 1)
    alpha[edge_mask] *= (1 - 0.8 * dark[edge_mask])
    return rgb_corr, alpha

def compute_cx(frames_arr, alphas, top_frac=0.45):
    """Compute alpha-weighted mean x for top 45% of rows."""
    H, W = alphas[0].shape
    top_rows = int(H * top_frac)
    total_w = np.zeros(W)
    for a in alphas:
        total_w += a[:top_rows, :].sum(axis=0)
    xs = np.arange(W)
    total = total_w.sum()
    if total < 1:
        return 0.5
    cx = (total_w * xs).sum() / total / W
    return float(cx)

def union_bbox(alphas, threshold=6/255.0):
    """Union bounding box of alpha > threshold across all frames."""
    H, W = alphas[0].shape
    any_mask = np.zeros((H,W), dtype=bool)
    for a in alphas:
        any_mask |= (a > threshold)
    rows = np.any(any_mask, axis=1)
    cols = np.any(any_mask, axis=0)
    rmin = int(np.argmax(rows))
    rmax = int(len(rows) - 1 - np.argmax(rows[::-1]))
    cmin = int(np.argmax(cols))
    cmax = int(len(cols) - 1 - np.argmax(cols[::-1]))
    return cmin, rmin, cmax-cmin+1, rmax-rmin+1

def resize_to_virtual(arr, alpha, vw=VW, vh=VH):
    """Resize frame+alpha to 1600×900 virtual space."""
    ih, iw = arr.shape[:2]
    scale = min(vw/iw, vh/ih)
    nw, nh = int(iw*scale), int(ih*scale)
    rgba = np.dstack([arr.astype(np.uint8), (alpha*255).astype(np.uint8)])
    pil = Image.fromarray(rgba, 'RGBA')
    pil = pil.resize((nw, nh), Image.LANCZOS)
    # Pad to vw×vh
    out = Image.new('RGBA', (vw, vh), (0,0,0,0))
    ox, oy = (vw-nw)//2, (vh-nh)//2
    out.paste(pil, (ox, oy))
    out_arr = np.array(out)
    return out_arr[:,:,:3], out_arr[:,:,3]/255.0

def save_webp(rgb, alpha, path, quality, alpha_quality=90):
    """Save RGBA WebP."""
    rgba = np.dstack([np.clip(rgb,0,255).astype(np.uint8),
                      np.clip(alpha*255,0,255).astype(np.uint8)])
    img = Image.fromarray(rgba, 'RGBA')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, 'WEBP', quality=quality, method=6,
             icc_profile=b'', exact=False)

def main():
    PORTFOLIO = "portfolio/public/frames"
    LG = os.path.join(PORTFOLIO, "lg")
    SM = os.path.join(PORTFOLIO, "sm")
    os.makedirs(LG, exist_ok=True)
    os.makedirs(SM, exist_ok=True)

    # 1. Extract frames
    print("[1] Extracting frames...")
    frames_list = extract_full_frames()
    n = len(frames_list)
    print(f"    Total frames: {n}")

    # 2. Detect cuts
    print("[2] Detecting shot cuts...")
    cuts = detect_cuts(frames_list)
    # Build shots
    shots = []
    for i in range(len(cuts)-1):
        shots.append({'from': cuts[i], 'to': cuts[i+1]-1})
    print(f"    Shots: {shots}")

    # 3. For each shot, process frames
    print("[3] Processing frames per shot...")
    manifest_shots = []
    total_count = 0

    # Load rembg session once
    print("    Loading rembg model...")
    try:
        from rembg import remove, new_session
        sess = new_session("u2net_human_seg")
        has_rembg = True
    except Exception as e:
        print(f"    rembg unavailable: {e}, using props mask only")
        has_rembg = False

    for si, shot in enumerate(shots):
        print(f"  Shot {si+1}: frames {shot['from']}–{shot['to']}")
        frame_indices = list(range(shot['from'], shot['to']+1))
        
        # First pass: compute masks and collect alphas for bbox
        alphas = []
        rgbs = []
        
        for fi in frame_indices[:min(5, len(frame_indices))]:  # sample for bbox
            fname = frames_list[fi]
            img = Image.open(os.path.join(FULL_DIR, fname)).convert('RGB')
            arr = np.array(img)
            
            # Masks
            if has_rembg:
                pmask = person_mask_rembg(arr)
            else:
                pmask = np.zeros(arr.shape[:2], dtype=np.float32)
            
            props = props_mask(arr)
            rgb_c, alpha = combine_masks(pmask, props, arr)
            rgb_virt, alpha_virt = resize_to_virtual(rgb_c, alpha)
            alphas.append(alpha_virt)
            rgbs.append(rgb_virt)
        
        # Compute union bbox from sample
        bbox = union_bbox(alphas, threshold=6/255.0)
        x, y, w, h = bbox
        
        # CX from sample (for laptop shot = last shot, use person only logic for top 45%)
        cx = compute_cx(rgbs, alphas)
        
        print(f"    BBox: {bbox}, CX: {cx:.3f}")
        
        # Second pass: process ALL frames
        all_alphas_shot = []
        for fi in frame_indices:
            fname = frames_list[fi]
            img = Image.open(os.path.join(FULL_DIR, fname)).convert('RGB')
            arr = np.array(img)
            
            if has_rembg:
                pmask = person_mask_rembg(arr)
            else:
                pmask = np.zeros(arr.shape[:2], dtype=np.float32)
            
            props = props_mask(arr)
            rgb_c, alpha = combine_masks(pmask, props, arr)
            rgb_virt, alpha_virt = resize_to_virtual(rgb_c, alpha)
            all_alphas_shot.append(alpha_virt)
            
            # Crop to shot bbox
            rgb_crop = rgb_virt[y:y+h, x:x+w]
            a_crop   = alpha_virt[y:y+h, x:x+w]
            
            # Save lg
            global_idx = fi
            lg_path = os.path.join(LG, f"f{global_idx:03d}.webp")
            save_webp(rgb_crop, a_crop, lg_path, Q_LG, ALPHA_Q)
            
            # Save sm (half size)
            rgb_sm = rgb_crop[::2, ::2]
            a_sm   = a_crop[::2, ::2]
            sm_path = os.path.join(SM, f"f{global_idx:03d}.webp")
            save_webp(rgb_sm, a_sm, sm_path, Q_SM)
            
            total_count += 1
            if fi % 10 == 0:
                print(f"    Frame {fi} saved")
        
        manifest_shots.append({
            "from": shot['from'],
            "to": shot['to'],
            "box": list(bbox),
            "cx": cx
        })

    # Write manifest
    manifest = {
        "w": VW, "h": VH,
        "count": total_count,
        "shots": manifest_shots
    }
    mpath = os.path.join(PORTFOLIO, "manifest.json")
    with open(mpath, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"\n[4] Manifest written: {mpath}")
    print(json.dumps(manifest, indent=2))

if __name__ == "__main__":
    main()
