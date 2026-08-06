#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Routes to test: authenticated screens in tabs
const routes = [
  { path: '/', name: 'Home', width: 402, height: 874 },
  { path: '/five45', name: 'Five45', width: 402, height: 874 },
  { path: '/five45/goals', name: 'Five45 Goals (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/five45/templates', name: 'Five45 Templates (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/five45/review', name: 'Five45 Review (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/five45/new-cycle', name: 'Five45 New Cycle (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/prayer', name: 'Prayer', width: 402, height: 874 },
  { path: '/work', name: 'Work', width: 402, height: 874 },
  { path: '/work/funnel', name: 'Work Funnel (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/more', name: 'More', width: 402, height: 874 },
  { path: '/more/insights', name: 'More Insights', width: 402, height: 874 },
  { path: '/more/retention', name: 'More Retention', width: 402, height: 874 },
  { path: '/more/sleep', name: 'More Sleep', width: 402, height: 874 },
  { path: '/more/settings', name: 'More Settings', width: 402, height: 874 },
  { path: '/more/settings/notifications', name: 'Settings Notifications (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/more/settings/prayer', name: 'Settings Prayer (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/more/workout', name: 'More Workout', width: 402, height: 874 },
  { path: '/more/workout/history', name: 'Workout History (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/more/workout/exercise/test-id', name: 'Workout Exercise (headerLargeTitle: false)', width: 402, height: 874 },
  { path: '/sign-in', name: 'Sign In', width: 402, height: 874 },
  // Tablet versions
  { path: '/', name: 'Home (Tablet)', width: 834, height: 1112 },
  { path: '/five45', name: 'Five45 (Tablet)', width: 834, height: 1112 },
  { path: '/five45/goals', name: 'Five45 Goals Tablet (headerLargeTitle: false)', width: 834, height: 1112 },
  { path: '/five45/templates', name: 'Five45 Templates Tablet (headerLargeTitle: false)', width: 834, height: 1112 },
  { path: '/work/funnel', name: 'Work Funnel Tablet (headerLargeTitle: false)', width: 834, height: 1112 },
  { path: '/more/settings/notifications', name: 'Settings Notifications Tablet (headerLargeTitle: false)', width: 834, height: 1112 },
  { path: '/more/workout/history', name: 'Workout History Tablet (headerLargeTitle: false)', width: 834, height: 1112 },
];

async function checkOverlap(page) {
  return await page.evaluate(() => {
    const overlaps = [];
    const elements = document.querySelectorAll('*');

    // Get all text elements and buttons
    const textElements = Array.from(elements).filter(el => {
      if (el.offsetHeight === 0 || el.offsetWidth === 0) return false;
      // Skip elements that are definitely UI chrome
      if (el.classList.contains('tab-bar') || el.id === 'root' || el.id === 'main') return false;
      const text = el.textContent?.trim();
      return text && text.length > 0;
    });

    // Check for overlaps
    for (let i = 0; i < textElements.length; i++) {
      for (let j = i + 1; j < textElements.length; j++) {
        const rect1 = textElements[i].getBoundingClientRect();
        const rect2 = textElements[j].getBoundingClientRect();

        // Skip if either element is parent of the other
        if (textElements[i].contains(textElements[j]) || textElements[j].contains(textElements[i])) {
          continue;
        }

        // Check if rects overlap
        if (!(rect1.right < rect2.left || rect1.left > rect2.right ||
              rect1.bottom < rect2.top || rect1.top > rect2.bottom)) {
          // Only report if centers are reasonably close (not just touching edges)
          const dx = Math.abs((rect1.left + rect1.right) / 2 - (rect2.left + rect2.right) / 2);
          const dy = Math.abs((rect1.top + rect1.bottom) / 2 - (rect2.top + rect2.bottom) / 2);

          if (dx < Math.min(rect1.width, rect2.width) * 0.8 &&
              dy < Math.min(rect1.height, rect2.height) * 0.8) {
            overlaps.push({
              el1: textElements[i].tagName + (textElements[i].className ? '.' + textElements[i].className.split(' ')[0] : ''),
              el2: textElements[j].tagName + (textElements[j].className ? '.' + textElements[j].className.split(' ')[0] : ''),
              text1: textElements[i].textContent?.substring(0, 50),
              text2: textElements[j].textContent?.substring(0, 50),
            });
          }
        }
      }
    }

    return overlaps;
  });
}

async function checkChromeOverlap(page) {
  return await page.evaluate(() => {
    // Find the tab bar and header
    const tabBar = document.querySelector('[role="tablist"]');
    let chromeBottom = 0;

    if (tabBar) {
      chromeBottom = tabBar.getBoundingClientRect().bottom;
    }

    // Find header if present
    const header = document.querySelector('[role="banner"]');
    if (header) {
      chromeBottom = Math.max(chromeBottom, header.getBoundingClientRect().bottom);
    }

    if (chromeBottom === 0) return null;

    // Check if any text element's top is above the chrome bottom
    const elements = document.querySelectorAll('*');
    const issues = [];

    Array.from(elements).forEach(el => {
      if (el.offsetHeight === 0) return;
      const text = el.textContent?.trim();
      if (!text || text.length === 0) return;

      const rect = el.getBoundingClientRect();
      if (rect.top > 0 && rect.top < chromeBottom && rect.top < rect.bottom - 2) {
        issues.push({
          text: text.substring(0, 50),
          elementTop: rect.top,
          chromeBottom: chromeBottom,
          gap: chromeBottom - rect.top,
        });
      }
    });

    return issues.length > 0 ? { chromeBottom, issues } : null;
  });
}

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const html = document.documentElement;
    return {
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      overflowing: html.scrollWidth > html.clientWidth,
    };
  });
}

async function testRoute(browser, route, baseUrl) {
  const page = await browser.newPage();
  page.setViewportSize({ width: route.width, height: route.height });

  const url = `${baseUrl}${route.path}`;
  console.log(`Testing: ${route.name} (${route.width}×${route.height}) - ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

    // Wait a bit for animations to settle
    await page.waitForTimeout(500);

    const overflow = await checkOverflow(page);
    const overlaps = await checkOverlap(page);
    const chromeOverlap = await checkChromeOverlap(page);

    const issues = [];
    if (overflow.overflowing) {
      issues.push(`❌ OVERFLOW: ${overflow.scrollWidth}px > ${overflow.clientWidth}px`);
    }
    if (overlaps.length > 0) {
      issues.push(`❌ TEXT OVERLAP: ${overlaps.length} overlapping elements`);
      overlaps.forEach(o => {
        issues.push(`   - "${o.text1}" overlaps "${o.text2}"`);
      });
    }
    if (chromeOverlap) {
      issues.push(`❌ CHROME OVERLAP: Content hidden behind header/tabbar`);
      chromeOverlap.issues.forEach(i => {
        issues.push(`   - "${i.text}" at top: ${i.elementTop.toFixed(1)}, chrome ends at: ${i.chromeBottom.toFixed(1)}`);
      });
    }

    if (issues.length === 0) {
      console.log(`✅ PASS`);
    } else {
      console.log(issues.join('\n'));
    }

    // Take screenshot
    const screenshotPath = `/tmp/claude-0/-home-user-LIFE/e66c3b4e-1c0c-5820-a744-6663f5168465/scratchpad/screenshot-${route.name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')}-${route.width}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Screenshot: ${screenshotPath}`);

    return {
      route: route.name,
      path: route.path,
      size: `${route.width}×${route.height}`,
      passed: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.log(`⚠️  ERROR: ${error.message}`);
    return {
      route: route.name,
      path: route.path,
      size: `${route.width}×${route.height}`,
      passed: false,
      issues: [`ERROR: ${error.message}`],
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const baseUrl = 'http://localhost:8081';

  console.log(`\n🧪 Starting screen sweep test suite...\n`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Routes: ${routes.length}\n`);

  const results = [];

  for (const route of routes) {
    const result = await testRoute(browser, route, baseUrl);
    results.push(result);
    console.log('');
  }

  await browser.close();

  // Summary
  console.log('\n📊 SUMMARY\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  console.log(`Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('❌ FAILED ROUTES:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`${r.route} (${r.path}, ${r.size}):`);
      r.issues.forEach(issue => console.log(`  ${issue}`));
      console.log('');
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
