import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve('screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log('[1] Launching Chrome headless...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  // ── 1. Desktop 1600x900 ──────────────────────────────────────────
  console.log('\n[2] Testing Desktop 1600x900...');
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Wait for preloader to finish and unmount
  console.log('    Waiting for preloader...');
  await page.waitForFunction(() => !document.querySelector('.preloader'), { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  // Get total scroll height and section rects
  const sections = await page.evaluate(() => {
    const ids = ['hero', 'about', 'work', 'journey', 'skills', 'awards', 'contact'];
    return ids.map((id) => {
      const el = document.getElementById(id);
      return {
        id,
        offsetTop: el ? el.offsetTop : 0,
        offsetHeight: el ? el.offsetHeight : 0,
      };
    });
  });

  console.log('    Found sections:', sections);

  const vh = 900;
  const desktopCaptures = [
    { name: '01_desktop_hero', y: 0 },
    { name: '02_desktop_blade_hero_about', y: sections[1].offsetTop - 0.5 * vh },
    { name: '03_desktop_about', y: sections[1].offsetTop + 0.6 * vh },
    { name: '04_desktop_blade_about_work', y: sections[2].offsetTop - 0.5 * vh },
    { name: '05_desktop_work_card1', y: sections[2].offsetTop + 0.2 * vh },
    { name: '06_desktop_work_card2', y: sections[2].offsetTop + 1.6 * vh },
    { name: '07_desktop_work_card3', y: sections[2].offsetTop + 2.8 * vh },
    { name: '08_desktop_blade_work_journey', y: sections[3].offsetTop - 0.5 * vh },
    { name: '09_desktop_journey', y: sections[3].offsetTop + 0.6 * vh },
    { name: '10_desktop_skills_orbit', y: sections[4].offsetTop + 0.8 * vh },
    { name: '11_desktop_awards_cylinder', y: sections[5].offsetTop + 0.8 * vh },
    { name: '12_desktop_blade_awards_contact', y: sections[6].offsetTop - 0.4 * vh },
    { name: '13_desktop_contact_red', y: sections[6].offsetTop + 0.8 * vh },
  ];

  for (const cap of desktopCaptures) {
    await page.evaluate((y) => {
      if (window.__lenis) {
        window.__lenis.scrollTo(y, { immediate: true });
      } else {
        window.scrollTo(0, y);
      }
      if (window.__tick) window.__tick();
    }, cap.y);
    // Allow animation/canvas to update
    await new Promise((r) => setTimeout(r, 600));
    const filepath = path.join(OUT_DIR, `${cap.name}.png`);
    await page.screenshot({ path: filepath });
    console.log(`    Captured: ${cap.name}.png (y=${Math.round(cap.y)})`);
  }

  await page.close();

  // ── 2. Mobile 390x844 ────────────────────────────────────────────
  console.log('\n[3] Testing Mobile 390x844...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  await mobilePage.waitForFunction(() => !document.querySelector('.preloader'), { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  const mobileSections = await mobilePage.evaluate(() => {
    const ids = ['hero', 'about', 'work', 'journey', 'skills', 'awards', 'contact'];
    return ids.map((id) => {
      const el = document.getElementById(id);
      return {
        id,
        offsetTop: el ? el.offsetTop : 0,
        offsetHeight: el ? el.offsetHeight : 0,
      };
    });
  });

  const mvh = 844;
  const mobileCaptures = [
    { name: '14_mobile_hero', y: 0 },
    { name: '15_mobile_about', y: mobileSections[1].offsetTop + 0.5 * mvh },
    { name: '16_mobile_work', y: mobileSections[2].offsetTop + 1.0 * mvh },
    { name: '17_mobile_journey', y: mobileSections[3].offsetTop + 0.5 * mvh },
    { name: '18_mobile_skills', y: mobileSections[4].offsetTop + 0.5 * mvh },
    { name: '19_mobile_awards', y: mobileSections[5].offsetTop + 0.5 * mvh },
    { name: '20_mobile_contact', y: mobileSections[6].offsetTop + 0.6 * mvh },
  ];

  for (const cap of mobileCaptures) {
    await mobilePage.evaluate((y) => {
      if (window.__lenis) {
        window.__lenis.scrollTo(y, { immediate: true });
      } else {
        window.scrollTo(0, y);
      }
      if (window.__tick) window.__tick();
    }, cap.y);
    await new Promise((r) => setTimeout(r, 600));
    const filepath = path.join(OUT_DIR, `${cap.name}.png`);
    await mobilePage.screenshot({ path: filepath });
    console.log(`    Captured: ${cap.name}.png (y=${Math.round(cap.y)})`);
  }

  await mobilePage.close();
  await browser.close();
  console.log('\n[4] All screenshots completed successfully in:', OUT_DIR);
}

run().catch((err) => {
  console.error('Error running screenshots:', err);
  process.exit(1);
});
