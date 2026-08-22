import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA audit with axe-core, run against every page in the site.
 *
 * This replaces the older pa11y-ci setup: axe reuses the Chromium that
 * Playwright already installs (no second browser download, no unmaintained
 * puppeteer dependency), and it runs at both viewports for free.
 *
 * Automated testing catches roughly a third to a half of real accessibility
 * problems. A clean run here is a floor, not a guarantee — keyboard-test the
 * lightbox, the mobile menu and the form by hand before launch.
 */

const PAGES = ['/', '/about-ethan', '/privacy', '/terms', '/disclaimer', '/thank-you', '/404'];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

for (const path of PAGES) {
  test(`${path} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(TAGS)
      // Astro's dev toolbar is injected in dev only and is not our markup.
      .exclude('astro-dev-toolbar')
      .analyze();

    // Print a readable summary before failing, so the report is actionable.
    if (results.violations.length) {
      console.error(
        `\naxe violations on ${path}:\n` +
          results.violations
            .map(
              (v) =>
                `  [${v.impact}] ${v.id}: ${v.help}\n` +
                v.nodes.map((n) => `      ${n.target.join(' ')}`).join('\n')
            )
            .join('\n')
      );
    }

    expect(results.violations).toEqual([]);
  });
}

test('the floorplan lightbox is accessible once open', async ({ page }) => {
  await page.goto('/#floorplans');
  await page.locator('a[data-lightbox="floorplans"]').first().click();
  await expect(page.locator('dialog#lightbox')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .exclude('astro-dev-toolbar')
    .analyze();

  expect(results.violations).toEqual([]);
});

test('the mobile menu is accessible once open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#menu-toggle').click();
  await expect(page.locator('#mobile-menu')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .exclude('astro-dev-toolbar')
    .analyze();

  expect(results.violations).toEqual([]);
});
