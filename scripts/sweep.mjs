#!/usr/bin/env node
//
// Layout sweep: render the app and assert that nothing overlaps anything else.
//
// This exists because layout regressions in this project have never been found
// by reading a diff — the header overlap, the iPad wrap overlap and the
// see-through-header overlap were all found by looking at a rendered screen.
//
// Two lessons from the bugs that got through are built into the checks:
//
//   1. Check while SCROLLED, not only at rest. A pinned transparent header
//      looks perfect at scroll 0 and prints on top of the page the moment you
//      move. An at-rest-only sweep reported a clean pass while that bug was
//      live on production.
//
//   2. Reach screens by CLICKING THE TABS, not only by deep link. Inactive tab
//      scenes are not detached on web, so screens pile up as they are visited;
//      a fresh deep link to each route mounts one screen and sees nothing
//      wrong. The failure needs a walk through the tabs to appear at all.
//
// Usage: node scripts/sweep.mjs [baseUrl]     (default http://localhost:8081)

import { chromium } from 'playwright';

const BASE_URL = process.argv[2] ?? 'http://localhost:8081';
const CHROMIUM = '/opt/pw-browsers/chromium';

const VIEWPORTS = [
  { name: 'phone', width: 402, height: 874 },
  { name: 'tablet', width: 834, height: 1112 },
];

/** Every route, including the nine that override to a standard-size header. */
const ROUTES = [
  '/',
  '/five45',
  '/five45/templates',
  '/five45/goals',
  '/five45/review',
  '/five45/new-cycle',
  '/prayer',
  '/work',
  '/work/funnel',
  '/more',
  '/more/insights',
  '/more/retention',
  '/more/sleep',
  '/more/settings',
  '/more/settings/notifications',
  '/more/settings/prayer',
  '/more/workout',
  '/more/workout/history',
  '/more/workout/exercise/sweep-probe',
  '/sign-in',
];

// Selected by href, not by name: the accessible name of a tab includes its
// icon glyph ("\u{F02DC}Home"), so matching on the visible label alone finds
// nothing — and a tab-walk that silently matches nothing is how this sweep
// reported a pass over a bug that only a tab-walk can reach.
const TABS = [
  ['Home', '/'],
  ['Routine', '/five45'],
  ['Prayer', '/prayer'],
  ['Work', '/work'],
  ['More', '/more'],
];

/**
 * Runs in the page. Finds text that visibly collides with other text.
 *
 * Three distinctions matter, and each one is a bug this sweep previously
 * missed or misreported:
 *
 *   Leaf text only. A parent's box contains its children by definition, so
 *   comparing containers reports an "overlap" for every nested element.
 *
 *   Effective opacity, walked up the tree. That is how an inactive tab scene
 *   is hidden here — it still has boxes and still reports rects, so counting
 *   it would report collisions the eye cannot see.
 *
 *   Chrome is allowed to sit over content; that is the whole design. So a
 *   collision between chrome and content is judged on whether the chrome
 *   actually hides what is under it. Chrome that fails to is the bug that
 *   shipped: a header with `headerTransparent` and no background, with the
 *   page scrolling legibly through its own title.
 */
const COLLECT = `(() => {
  const alphaOf = (color) => {
    const m = /^rgba?\\(([^)]+)\\)$/.exec(color);
    if (!m) return 0;
    const parts = m[1].split(',').map((n) => parseFloat(n));
    return parts.length < 4 ? 1 : parts[3];
  };

  const effectiveOpacity = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden') return 0;
      o *= parseFloat(s.opacity);
      if (o < 0.02) return 0;
    }
    return o;
  };

  const intersects = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w <= 1 || h <= 1) return 0;
    const areaA = (a.right - a.left) * (a.bottom - a.top);
    const areaB = (b.right - b.left) * (b.bottom - b.top);
    return (w * h) / Math.min(areaA, areaB);
  };

  // Chrome surfaces announce themselves by their backdrop blur: that is what
  // ChromeBackground renders, for the tab bar and for every stack header.
  // Each carries how much it actually obscures — blur plus the scrim over it.
  const chrome = [];
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (!s.backdropFilter || !s.backdropFilter.includes('blur')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;

    // The scrim is a sibling painted over the blur, so measure the whole
    // chrome surface: the strongest background alpha covering this box.
    let cover = alphaOf(s.backgroundColor);
    const parent = el.parentElement;
    for (const layer of parent ? parent.querySelectorAll('*') : []) {
      const lr = layer.getBoundingClientRect();
      if (intersects(r, lr) < 0.9) continue;
      const ls = getComputedStyle(layer);
      cover = Math.max(cover, alphaOf(ls.backgroundColor) * effectiveOpacity(layer));
    }
    chrome.push({ rect: r, cover });
  }

  const inChrome = (rect) => chrome.find((c) => intersects(rect, c.rect) > 0.6);

  const items = [];
  for (const el of document.querySelectorAll('*')) {
    const text = (el.textContent || '').trim();
    if (!text) continue;
    if (Array.from(el.children).some((c) => (c.textContent || '').trim())) continue;

    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.bottom <= 0 || r.top >= innerHeight) continue;
    if (!effectiveOpacity(el)) continue;

    items.push({ text: text.slice(0, 60), rect: r, chrome: inChrome(r) });
  }

  const overlaps = [];
  const seeThrough = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (intersects(a.rect, b.rect) < 0.2) continue;

      // Both inside chrome: a tab's icon and its label share a box by design.
      if (a.chrome && b.chrome) continue;

      // One is chrome. Content passing beneath it is the intended behaviour —
      // but only if the chrome is opaque enough to actually hide it.
      const cover = a.chrome ?? b.chrome;
      if (cover) {
        if (cover.cover < 0.6) {
          seeThrough.push({
            a: a.text,
            b: b.text,
            cover: Number(cover.cover.toFixed(2)),
          });
        }
        continue;
      }

      overlaps.push({ a: a.text, b: b.text });
    }
  }

  return {
    overlaps,
    seeThrough,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };
})()`;

/** The app scrolls an inner element, not the document. */
const SCROLL_TO = (frac) => `(() => {
  const nodes = Array.from(document.querySelectorAll('*'))
    .filter((el) => el.scrollHeight - el.clientHeight > 40);
  const target = nodes.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
  if (!target) return 0;
  target.scrollTop = (target.scrollHeight - target.clientHeight) * ${frac};
  return target.scrollTop;
})()`;

async function checkAtScrollPositions(page, label, failures) {
  for (const [name, frac] of [['top', 0], ['middle', 0.5], ['bottom', 1]]) {
    await page.evaluate(SCROLL_TO(frac));
    await page.waitForTimeout(180);

    const r = await page.evaluate(COLLECT);

    if (r.overflowX) {
      failures.push(`${label} @${name}: horizontal overflow ${r.scrollWidth} > ${r.clientWidth}`);
    }
    for (const o of r.overlaps.slice(0, 4)) {
      failures.push(`${label} @${name}: "${o.a}" overlaps "${o.b}"`);
    }
    if (r.overlaps.length > 4) {
      failures.push(`${label} @${name}: …and ${r.overlaps.length - 4} more overlaps`);
    }
    for (const s of r.seeThrough.slice(0, 2)) {
      failures.push(
        `${label} @${name}: "${s.b}" shows through chrome over "${s.a}" (cover ${s.cover})`
      );
    }
    if (r.seeThrough.length > 2) {
      failures.push(
        `${label} @${name}: …and ${r.seeThrough.length - 2} more showing through chrome`
      );
    }
  }
}

async function sweepViewport(browser, viewport) {
  const failures = [];
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();

  // Pass 1 — every route by direct navigation.
  for (const route of ROUTES) {
    const label = `${viewport.name} ${route}`;
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(900);
      await checkAtScrollPositions(page, label, failures);
    } catch (err) {
      failures.push(`${label}: ${err.message.split('\n')[0]}`);
    }
  }

  // Pass 2 — walk the tabs by clicking, which is the only way the
  // scenes-pile-up failure shows itself.
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(900);

    // Twice around: the failure needs tabs to have been visited already, so
    // the second lap is the one that matters.
    for (const [label, href] of [...TABS, ...TABS]) {
      const tab = page.locator(`[role="tab"][href="${href}"]`).first();
      if (!(await tab.count())) {
        failures.push(`${viewport.name} tab-walk: no tab found for ${href}`);
        continue;
      }
      await tab.click();
      await page.waitForTimeout(650);
      await checkAtScrollPositions(page, `${viewport.name} tab-walk→${label}`, failures);
    }
  } catch (err) {
    failures.push(`${viewport.name} tab-walk: ${err.message.split('\n')[0]}`);
  }

  await context.close();
  return failures;
}

const browser = await chromium.launch({ executablePath: CHROMIUM });
const failures = [];

for (const viewport of VIEWPORTS) {
  process.stdout.write(`sweeping ${viewport.name} (${viewport.width}×${viewport.height})…\n`);
  failures.push(...(await sweepViewport(browser, viewport)));
}

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} layout failure(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log('\n✓ no overlap, no overflow — all routes, both widths, scrolled and tab-walked');
