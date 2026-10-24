#!/usr/bin/env python3
"""
Ultra-clean, high-speed frame extractor for Gaurav Saini portfolio.
Uses rembg u2net_human_seg with single session instance.
Outputs 1600x900 virtual coordinates, cropped shot bounding boxes, and WebP assets.
"""
import os, sys, json, time
import numpy as np
from PIL import Image
from rembg import remove, new_session

FULL_DIR = "full_frames"
PORTFOLIO = "portfolio/public/frames"
LG_DIR = os.path.join(PORTFOLIO, "lg")
SM_DIR = os.path.join(PORTFOLIO, "sm")
VW, VH = 1600, 900

SHOTS = [
    {"from": 0, "to": 59},
    {"from": 60, "to": 118},
    {"from": 119, "to": 191},
    {"from": 192, "to": 239},
]

def resize_to_virtual(arr, alpha, vw=VW, vh=VH):
    ih, iw = arr.shape[:2]
    scale = min(vw / iw, vh / ih)
    nw, nh = int(round(iw * scale)), int(round(ih * scale))
    
    rgba = np.dstack([arr.astype(np.uint8), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
    pil = Image.fromarray(rgba).resize((nw, nh), Image.LANCZOS)
    
    out = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
    ox, oy = (vw - nw) // 2, (vh - nh) // 2
    out.paste(pil, (ox, oy))
    out_arr = np.array(out)
    return out_arr[:, :, :3].astype(np.float32), out_arr[:, :, 3].astype(np.float32) / 255.0

def union_bbox(alphas, threshold=6.0 / 255.0):
    H, W = alphas[0].shape
    any_mask = np.zeros((H, W), dtype=bool)
    for a in alphas:
        any_mask |= (a > threshold)
    rows = np.any(any_mask, axis=1)
    cols = np.any(any_mask, axis=0)
    if not np.any(rows) or not np.any(cols):
        return 0, 0, W, H
    rmin = int(np.argmax(rows))
    rmax = int(len(rows) - 1 - np.argmax(rows[::-1]))
    cmin = int(np.argmax(cols))
    cmax = int(len(cols) - 1 - np.argmax(cols[::-1]))
    return cmin, rmin, cmax - cmin + 1, rmax - rmin + 1

def compute_cx(alphas, top_frac=0.45):
    H, W = alphas[0].shape
    top_rows = int(H * top_frac)
    total_w = np.zeros(W, dtype=np.float64)
    for a in alphas:
        total_w += a[:top_rows, :].sum(axis=0)
    xs = np.arange(W)
    total = total_w.sum()
    if total < 1:
        return 0.5
    cx = (total_w * xs).sum() / total / W
    return float(cx)

def save_webp(rgb, alpha, path, quality=80, alpha_quality=90):
    rgba = np.dstack([
        np.clip(rgb, 0, 255).astype(np.uint8),
        np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    ])
    img = Image.fromarray(rgba)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, 'WEBP', quality=quality, method=4, icc_profile=b'', exact=False)

def main():
    os.makedirs(LG_DIR, exist_ok=True)
    os.makedirs(SM_DIR, exist_ok=True)
    
    print("[1] Initializing rembg session...")
    t0 = time.time()
    sess = new_session("u2net_human_seg")
    print(f"    Session loaded in {time.time()-t0:.2f}s")
    
    manifest_shots = []
    total_processed = 0
    verification_frames = [25, 90, 155, 215]
    
    for s_idx, shot in enumerate(SHOTS):
        shot_from = shot["from"]
        shot_to = shot["to"]
        n_frames = shot_to - shot_from + 1
        print(f"\n[Shot {s_idx+1}/4] Processing frames {shot_from} to {shot_to} ({n_frames} frames)...")
        
        shot_rgbs_virt = []
        shot_alphas_virt = []
        
        t_shot_start = time.time()
        for fi in range(shot_from, shot_to + 1):
            fpath = os.path.join(FULL_DIR, f"f{fi:03d}.png")
            img = Image.open(fpath).convert('RGB')
            arr = np.array(img, dtype=np.float32)
            
            # Person mask from rembg (clean, sharp, no halo)
            pmask = np.array(remove(img, session=sess, only_mask=True), dtype=np.float32) / 255.0
            if pmask.ndim == 3:
                pmask = pmask[:, :, 0]
            
            # Resize to 1600x900 virtual space
            rvirt, avirt = resize_to_virtual(arr, pmask, VW, VH)
            shot_rgbs_virt.append(rvirt)
            shot_alphas_virt.append(avirt)
            
            if (fi - shot_from + 1) % 20 == 0 or fi == shot_to:
                print(f"    Frame {fi} segmented ({fi - shot_from + 1}/{n_frames})")
        
        # Compute shot union bounding box and cx
        bbox = union_bbox(shot_alphas_virt, threshold=6.0 / 255.0)
        bx, by, bw, bh = bbox
        cx = compute_cx(shot_alphas_virt, top_frac=0.45)
        print(f"    Shot {s_idx+1} BBox: [x={bx}, y={by}, w={bw}, h={bh}], CX: {cx:.3f} (took {time.time()-t_shot_start:.1f}s)")
        
        # Crop and save each frame in the shot
        t_save_start = time.time()
        for i, fi in enumerate(range(shot_from, shot_to + 1)):
            rgb_v = shot_rgbs_virt[i]
            a_v = shot_alphas_virt[i]
            
            rgb_crop = rgb_v[by:by+bh, bx:bx+bw]
            a_crop = a_v[by:by+bh, bx:bx+bw]
            
            lg_path = os.path.join(LG_DIR, f"f{fi:03d}.webp")
            save_webp(rgb_crop, a_crop, lg_path, quality=80, alpha_quality=90)
            
            # Half-size sm
            rgb_sm = rgb_crop[::2, ::2]
            a_sm = a_crop[::2, ::2]
            sm_path = os.path.join(SM_DIR, f"f{fi:03d}.webp")
            save_webp(rgb_sm, a_sm, sm_path, quality=78, alpha_quality=85)
            
            total_processed += 1
            
            # Check for verification frame
            if fi in verification_frames:
                bg_red = np.zeros((bh, bw, 4), dtype=np.uint8)
                bg_red[:, :, 0] = 255
                bg_red[:, :, 1] = 31
                bg_red[:, :, 2] = 31
                bg_red[:, :, 3] = 255
                
                fg = np.dstack([
                    np.clip(rgb_crop, 0, 255).astype(np.uint8),
                    (np.clip(a_crop, 0, 1) * 255).astype(np.uint8)
                ])
                fg_pil = Image.fromarray(fg)
                bg_pil = Image.fromarray(bg_red)
                comp = Image.alpha_composite(bg_pil, fg_pil)
                comp_path = f"verify_shot{s_idx+1}_f{fi:03d}_red.png"
                comp.save(comp_path)
                print(f"    [Verification] Saved {comp_path}")
        
        print(f"    Shot {s_idx+1} frames saved in {time.time()-t_save_start:.1f}s")
        
        manifest_shots.append({
            "from": shot_from,
            "to": shot_to,
            "box": [bx, by, bw, bh],
            "cx": round(cx, 4)
        })
    
    # Write manifest.json
    manifest = {
        "w": VW,
        "h": VH,
        "count": total_processed,
        "shots": manifest_shots
    }
    mpath = os.path.join(PORTFOLIO, "manifest.json")
    with open(mpath, "w") as f:
        json.dump(manifest, f, indent=2)
    
    print("\n[Done] Manifest written to:", mpath)
    print(json.dumps(manifest, indent=2))
    print(f"Total time: {time.time()-t0:.1f}s for {total_processed} frames")

if __name__ == "__main__":
    main()
