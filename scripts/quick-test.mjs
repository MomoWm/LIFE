#!/usr/bin/env node

import { chromium } from 'playwright';

async function testRoute(route, width, height) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  page.setViewportSize({ width, height });

  const url = `http://localhost:8081${route}`;
  console.log(`Testing: ${route} (${width}×${height})`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(800);

    const chromeOverlap = await page.evaluate(() => {
      const tabBar = document.querySelector('[role="tablist"]');
      let chromeBottom = 0;

      if (tabBar) {
        chromeBottom = tabBar.getBoundingClientRect().bottom;
      }

      if (chromeBottom === 0) return null;

      const elements = document.querySelectorAll('*');
      const issues = [];

      Array.from(elements).forEach(el => {
        if (el.offsetHeight === 0) return;
        const text = el.textContent?.trim();
        if (!text || text.length === 0) return;
        if (text.length > 100) return; // Skip large text blocks

        const rect = el.getBoundingClientRect();
        if (rect.top > 0 && rect.top < chromeBottom && rect.top < rect.bottom - 2) {
          issues.push({
            text: text.substring(0, 30),
            elementTop: rect.top,
            chromeBottom: chromeBottom,
          });
        }
      });

      return issues.length > 0 ? { chromeBottom, issues } : null;
    });

    if (chromeOverlap) {
      console.log(`❌ CHROME OVERLAP detected at ${chromeOverlap.chromeBottom}px`);
      chromeOverlap.issues.slice(0, 3).forEach(i => {
        console.log(`   - "${i.text}" at ${i.elementTop.toFixed(1)}px`);
      });
    } else {
      console.log(`✅ No chrome overlap detected`);
    }

    await page.screenshot({ path: `/tmp/test-${route.replace(/\//g, '-')}.png`, fullPage: false });

  } catch (error) {
    console.log(`⚠️  ERROR: ${error.message}`);
  } finally {
    await page.close();
    await browser.close();
  }
}

await testRoute('/five45/goals', 402, 874);
await testRoute('/five45/goals', 834, 1112);
await testRoute('/prayer', 402, 874);
