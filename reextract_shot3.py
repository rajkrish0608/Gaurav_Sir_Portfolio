#!/usr/bin/env python3
"""
Re-extract Shot 3 (frames 119-191) with isnet-general-use to preserve the laptop and desk!
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

SHOT_FROM = 119
SHOT_TO = 191

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
    # In laptop shot, measure the person only, not the table (top 45% of rows is head & shoulders)
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

def save_webp(rgb, alpha, path, quality=80):
    rgba = np.dstack([
        np.clip(rgb, 0, 255).astype(np.uint8),
        np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    ])
    img = Image.fromarray(rgba)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, 'WEBP', quality=quality, method=4, icc_profile=b'', exact=False)

def main():
    print("[1] Loading isnet-general-use session...")
    t0 = time.time()
    sess = new_session("isnet-general-use")
    print(f"    Loaded in {time.time()-t0:.2f}s")
    
    n_frames = SHOT_TO - SHOT_FROM + 1
    print(f"[2] Segmenting Shot 3 (frames {SHOT_FROM}..{SHOT_TO}, {n_frames} frames)...")
    
    shot_rgbs_virt = []
    shot_alphas_virt = []
    
    t_seg = time.time()
    for fi in range(SHOT_FROM, SHOT_TO + 1):
        fpath = os.path.join(FULL_DIR, f"f{fi:03d}.png")
        img = Image.open(fpath).convert('RGB')
        arr = np.array(img, dtype=np.float32)
        
        mask = np.array(remove(img, session=sess, only_mask=True), dtype=np.float32) / 255.0
        if mask.ndim == 3:
            mask = mask[:, :, 0]
        
        rvirt, avirt = resize_to_virtual(arr, mask, VW, VH)
        shot_rgbs_virt.append(rvirt)
        shot_alphas_virt.append(avirt)
        
        if (fi - SHOT_FROM + 1) % 15 == 0 or fi == SHOT_TO:
            print(f"    Frame {fi} segmented ({fi - SHOT_FROM + 1}/{n_frames})")
            
    print(f"    Segmentation completed in {time.time()-t_seg:.1f}s")
    
    bbox = union_bbox(shot_alphas_virt, threshold=6.0 / 255.0)
    bx, by, bw, bh = bbox
    cx = compute_cx(shot_alphas_virt, top_frac=0.45)
    print(f"[3] Shot 3 BBox: [x={bx}, y={by}, w={bw}, h={bh}], CX: {cx:.4f}")
    
    print("[4] Saving WebP frames (lg & sm)...")
    t_save = time.time()
    for i, fi in enumerate(range(SHOT_FROM, SHOT_TO + 1)):
        rgb_v = shot_rgbs_virt[i]
        a_v = shot_alphas_virt[i]
        
        rgb_crop = rgb_v[by:by+bh, bx:bx+bw]
        a_crop = a_v[by:by+bh, bx:bx+bw]
        
        lg_path = os.path.join(LG_DIR, f"f{fi:03d}.webp")
        save_webp(rgb_crop, a_crop, lg_path, quality=80)
        
        rgb_sm = rgb_crop[::2, ::2]
        a_sm = a_crop[::2, ::2]
        sm_path = os.path.join(SM_DIR, f"f{fi:03d}.webp")
        save_webp(rgb_sm, a_sm, sm_path, quality=78)
    
    print(f"    Saved all WebP frames in {time.time()-t_save:.1f}s")
    
    # Update manifest.json
    mpath = os.path.join(PORTFOLIO, "manifest.json")
    with open(mpath, "r") as f:
        manifest = json.load(f)
    
    for s in manifest["shots"]:
        if s["from"] == SHOT_FROM and s["to"] == SHOT_TO:
            s["box"] = [bx, by, bw, bh]
            s["cx"] = round(cx, 4)
            print("    Updated Shot 3 in manifest:", s)
            break
            
    with open(mpath, "w") as f:
        json.dump(manifest, f, indent=2)
    print("    Manifest saved to:", mpath)

    # Verification composite on red for frame 140
    idx_140 = 140 - SHOT_FROM
    rgb_crop_140 = shot_rgbs_virt[idx_140][by:by+bh, bx:bx+bw]
    a_crop_140 = shot_alphas_virt[idx_140][by:by+bh, bx:bx+bw]
    bg_red = np.zeros((bh, bw, 4), dtype=np.uint8)
    bg_red[:, :, 0] = 255; bg_red[:, :, 1] = 31; bg_red[:, :, 2] = 31; bg_red[:, :, 3] = 255
    fg = np.dstack([
        np.clip(rgb_crop_140, 0, 255).astype(np.uint8),
        (np.clip(a_crop_140, 0, 1) * 255).astype(np.uint8)
    ])
    comp = Image.alpha_composite(Image.fromarray(bg_red), Image.fromarray(fg))
    comp.save("verify_shot3_with_laptop_red.png")
    print("    Saved verification: verify_shot3_with_laptop_red.png")

if __name__ == "__main__":
    main()
