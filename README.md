# Gaurav_Sir_Portfolio

> Award-level, scroll-driven interactive personal portfolio for **Gaurav Saini** — Product Leader, Systems Architect & Entrepreneur.

An immersive, cinema-grade portfolio website featuring 60 FPS scroll-driven dynamic video choreography, pure CSS 3D interactive visualizations, and fluid kinetic typography.

---

## ⚡ Highlights & Key Features

- **Scroll-Driven Cinema Engine**:
  - 240 dual-resolution WebP frames (`public/frames/lg` & `sm`) delivering seamless 60 FPS video playback locked to scroll position.
  - Custom stride loader (shot boundaries $\rightarrow$ 8 $\rightarrow$ 4 $\rightarrow$ 2 $\rightarrow$ 1 stride) for sub-second first-paint readiness.
  - GSAP ticker integration with Lenis smooth-scroll for zero-stutter frame interpolation.
- **Pure CSS 3D Showcase**:
  - **Selected Work**: Interactive 3D perspective card deck with real-time telemetry visuals (live SVG gauges, fleet activity matrix, AI chat notifications).
  - **Skills Orbit**: Interactive 3D orbiting sphere with real-time category filtering (Leadership, AI/ML, Engineering, Architecture, Product).
  - **Awards Cylinder**: Revolving CSS 3D cylindrical gallery with dynamic counter-rotating badges.
- **Signature Aesthetics**:
  - Bold Swiss-style typography pairing: **Anton** for monumental display headlines, **Inter Tight** for editorial prose, and **JetBrains Mono** for technical telemetry.
  - Curated high-contrast palette: Vivid International Red (`#ff1f1f`), Deep Ink (`#0d0d0d`), and Crisp Paper (`#ffffff`).
  - Fluid magnetic custom cursor with reactive expansion states and contextual labels.
- **Enterprise-Grade Responsive Design**:
  - Tailored layout adaptations across UltraWide, Desktop, Laptop, Tablet, and Mobile viewports.
  - Automatic memory and asset optimization with responsive asset resolution selection.

---

## 🛠️ Tech Stack

- **Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Animation & Motion**: [GSAP](https://greensock.com/gsap/) (Ticker engine), [Lenis](https://lenis.darkroom.engineering/) (Smooth scroll)
- **Typography**: `@fontsource/anton`, `@fontsource-variable/inter-tight`, `@fontsource/jetbrains-mono`
- **Styling**: Vanilla Modern CSS & CSS 3D transforms (Zero heavy 3D engine overhead)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/codecafe-lab-it-solutions/Gaurav_Sir_Portfolio.git
   cd Gaurav_Sir_Portfolio
   ```

2. **Navigate to the portfolio web application**:
   ```bash
   cd portfolio
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```
   The production-ready bundle will be output to `portfolio/dist`.

---

## 📂 Project Structure

```
Gaurav_Sir_Portfolio/
├── README.md
├── .gitignore
├── extract_frames.py          # Frame extraction & preprocessing pipeline
├── reextract_shot3.py         # ISNet-based matting pipeline for Shot 3
└── portfolio/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── public/
    │   ├── portrait.png
    │   └── frames/            # Pre-rendered 60FPS dual-res WebP sequences
    │       ├── manifest.json
    │       ├── lg/            # High-res frames
    │       └── sm/            # Mobile-optimized frames
    └── src/
        ├── App.tsx
        ├── data.ts            # Content schema and profile data
        ├── styles.css         # Design system tokens and layout rules
        ├── components/
        │   ├── BackLayer.tsx  # Monumental kinetic background typography
        │   ├── Chrome.tsx     # Navigation header, HUD, audio & rail
        │   ├── Preloader.tsx  # Initial loading screen and percentage ticker
        │   └── Stage.tsx      # High-performance canvas frame director
        ├── engine/
        │   ├── director.ts    # Scroll engine, scene timeline & blade cuts
        │   └── frames.ts      # Stride frame preloader and memory cache
        └── scenes/
            ├── Hero.tsx       # Opening scene
            ├── About.tsx      # Executive biography & statistics
            ├── Work.tsx       # 3D Project deck with telemetry
            ├── Journey.tsx    # Interactive milestone timeline
            ├── Skills.tsx     # 3D interactive orbiting skills sphere
            ├── Awards.tsx     # 3D revolving awards cylinder
            └── Contact.tsx    # Contact hub & direct communication line
```

---

## 📄 License

Proprietary © 2026 Gaurav Saini & CodeCafe Lab IT Solutions. All Rights Reserved.
