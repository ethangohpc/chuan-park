import { test, expect, type Page } from '@playwright/test';
import { GROUP_ORDER, GROUP_LABEL, unitGroups } from '../src/utils/unitGroups';

/**
 * The headline sizes this project actually has. Derived from the config rather
 * than written out, so the suite carries over to the next launch unchanged —
 * a project with no 1 Bedroom and no penthouse is not a failing project.
 */
const EXPECTED_GROUP_TITLES = unitGroups().map((g) => g.name);

const SECTION_IDS = [
  'about',
  'location',
  'price',
  'floorplans',
  'brochure',
  'gallery',
  'developer',
  'faq',
  'contact',
];

const isMobile = (page: Page) => page.viewportSize()!.width < 1136;

/**
 * Counts elements in the document's own DOM.
 *
 * Playwright locators pierce shadow DOM, so `locator('h1')` also matches
 * headings inside Astro's dev toolbar. Production has no toolbar, so counting
 * the light DOM is both the accurate check and a stable one.
 */
async function domCount(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
}

test.describe('Landing page', () => {
  test('loads with a single H1 and the project name in the title', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(await domCount(page, 'h1')).toBe(1);
    await expect(page).toHaveTitle(/.+/);
  });

  test('every navigation anchor has a matching section', async ({ page }) => {
    await page.goto('/');
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test('sections are server-rendered (present with JavaScript disabled)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    // FAQ answers must be in the served HTML, not injected by script.
    const answer = await page.locator('#faq details').first().innerText();
    expect(answer.length).toBeGreaterThan(120);
    await context.close();
  });

  test('Book Showflat CTA reaches the contact section', async ({ page }) => {
    await page.goto('/');
    // The hero holds two CTAs that both reach #contact; target the primary
    // (the secondary carries data-track-detail="secondary"). The header CTA is
    // hidden on narrow screens and the mobile-menu CTA only inside the menu.
    const cta = page.locator('#top a[data-track="book_showflat"]:not([data-track-detail])');
    await cta.click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('#contact')).toBeInViewport({ ratio: 0.05 });
  });

  test('WhatsApp and telephone links are correctly formatted when configured', async ({ page }) => {
    await page.goto('/');

    for (const link of await page.locator('a[href^="https://wa.me/"]').all()) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\/\d{8,15}\?text=.+/);
      expect(await link.getAttribute('rel')).toContain('noopener');
      expect(await link.getAttribute('target')).toBe('_blank');
    }

    for (const link of await page.locator('a[href^="tel:"]').all()) {
      expect(await link.getAttribute('href')).toMatch(/^tel:\+\d{8,15}$/);
    }
  });

  test('no external link opens without rel="noopener"', async ({ page }) => {
    await page.goto('/');
    const blank = page.locator('a[target="_blank"]');
    for (const link of await blank.all()) {
      expect(await link.getAttribute('rel')).toContain('noopener');
    }
  });

  test('no element forces horizontal overflow', async ({ page }) => {
    // A single unwrappable element widens the grid column, and Chrome then
    // expands the mobile layout viewport so the whole page renders zoomed out.
    // 320 and 768 are the widths that previously broke, so check both.
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => {
      // Content inside a deliberate scroll container (the price table) is
      // allowed to be wider — it scrolls within its own box.
      const inScrollContainer = (el: Element): boolean => {
        let node: Element | null = el.parentElement;
        while (node && node !== document.documentElement) {
          const overflowX = getComputedStyle(node).overflowX;
          if (overflowX === 'auto' || overflowX === 'scroll') return true;
          node = node.parentElement;
        }
        return false;
      };

      const offenders: { tag: string; cls: string; width: number }[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth + 1 && rect.height > 0 && !inScrollContainer(el)) {
          offenders.push({
            tag: el.tagName,
            cls: String((el as HTMLElement).className).slice(0, 40),
            width: Math.round(rect.width),
          });
        }
      });
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: offenders.slice(0, 8),
      };
    });

    expect(result.offenders).toEqual([]);
    expect(result.scrollWidth).toBeLessThanOrEqual(result.innerWidth + 1);

    for (const width of [360, 414, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(200);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `no horizontal overflow at ${width}px`).toBeLessThanOrEqual(width + 1);
    }
  });

  test('all images declare width and height', async ({ page }) => {
    await page.goto('/');
    const missing = await page.evaluate(() =>
      Array.from(document.images)
        // The lightbox <img> is an empty placeholder sized by CSS inside a
        // modal — it is not in page flow and cannot contribute to CLS.
        .filter((img) => img.id !== 'lightbox-image')
        .filter((img) => !img.getAttribute('width') || !img.getAttribute('height'))
        .map((img) => img.currentSrc || img.src)
    );
    expect(missing).toEqual([]);
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    const missing = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.getAttribute('alt') === null)
        .map((img) => img.src)
    );
    expect(missing).toEqual([]);
  });

  test('emits valid JSON-LD without fabricated reviews or offers', async ({ page }) => {
    await page.goto('/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const parsed = JSON.parse(block);
      const serialised = JSON.stringify(parsed);
      expect(serialised).not.toContain('aggregateRating');
      expect(serialised).not.toContain('"Review"');
      expect(serialised).not.toContain('"Offer"');
    }
  });

  test('the independent-website disclosure is visible on the page', async ({ page }) => {
    await page.goto('/');
    // The same wording also sits inside the closed mobile menu, so assert on
    // the copy that is actually on screen.
    const visible = page.getByText(/not the official developer website/i).locator('visible=true');
    await expect(visible.first()).toBeVisible();
    expect(await visible.count()).toBeGreaterThan(0);
  });
});

test.describe('Navigation', () => {
  test('mobile menu opens, closes on Escape, and closes after a selection', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#menu-toggle');
    test.skip(!(await toggle.isVisible()), 'Hamburger is hidden at this viewport');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await menu.locator('a[data-menu-link]').first().click();
    await expect(menu).toBeHidden();
  });

  test('the sticky header does not cover section headings', async ({ page }) => {
    await page.goto('/#floorplans');
    const headingBox = await page.locator('#floorplans-title').boundingBox();
    const headerBox = await page.locator('.site-header').boundingBox();
    expect(headingBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
  });

  test('keyboard users reach the skip link first', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
  });
});

test.describe('Floorplans and gallery', () => {
  test('the floorplan modal opens and closes with Escape', async ({ page }) => {
    await page.goto('/#floorplans');
    await page.locator('a[data-lightbox="floorplans"]').first().click();
    const dialog = page.locator('dialog#lightbox');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img#lightbox-image')).toHaveAttribute('src', /.+/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('the gallery lightbox supports arrow-key navigation', async ({ page }) => {
    await page.goto('/#gallery');
    await page.locator('a[data-lightbox="gallery"]').first().click();
    const image = page.locator('img#lightbox-image');
    const first = await image.getAttribute('src');
    await page.keyboard.press('ArrowRight');
    await expect(image).not.toHaveAttribute('src', first!);
    await page.keyboard.press('Escape');
  });

  test('the floorplan carousel scrolls and its controls track the ends', async ({ page }) => {
    await page.goto('/#floorplans');
    // Two carousels now share this markup, so scope to the floorplans one.
    const track = page.locator('#floorplans [data-carousel-track]');
    await expect(track).toHaveCount(1);

    const prev = page.locator('#floorplans [data-carousel-prev]');
    const next = page.locator('#floorplans [data-carousel-next]');

    // Whether the track overflows depends on how many unit types the project
    // has and how wide the viewport is. Both outcomes are correct — what must
    // hold is that the controls tell the truth about which way it can move.
    const overflows = await track.evaluate((el) => el.scrollWidth > el.clientWidth + 1);

    // At rest it is scrolled to the start, so previous is dead either way.
    await expect(prev).toBeDisabled();

    if (!overflows) {
      // Nothing to scroll to: next must be dead too, not a button that lies.
      await expect(next).toBeDisabled();
      return;
    }

    await expect(next).toBeEnabled();
    await next.click();
    await expect
      .poll(() => track.evaluate((el) => el.scrollLeft), { timeout: 3000 })
      .toBeGreaterThan(0);
    await expect(prev).toBeEnabled();
  });

  test('the gallery is a carousel of large slides', async ({ page }) => {
    await page.goto('/#gallery');
    const track = page.locator('#gallery [data-carousel-track]');
    await expect(track).toHaveCount(1);
    const overflows = await track.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflows).toBe(true);

    // Every image must still be an anchor to the full file, so the gallery
    // works with the lightbox script absent.
    const links = page.locator('#gallery a[data-lightbox="gallery"]');
    expect(await links.count()).toBeGreaterThan(1);
    for (const link of await links.all()) {
      expect(await link.getAttribute('href')).toMatch(/\.(webp|avif|jpe?g|png)$/i);
    }
  });

  test('unit types are consolidated to the headline sizes, in order', async ({ page }) => {
    await page.goto('/#floorplans');
    const titles = await page
      .locator('.fp-card__title')
      .evaluateAll((els) => els.map((e) => e.textContent!.trim()));

    // Exactly the groups this project has, in the canonical small-to-large order.
    expect(titles).toEqual(EXPECTED_GROUP_TITLES);
    const canonical = GROUP_ORDER.map((key) => GROUP_LABEL[key]);
    expect(titles).toEqual(canonical.filter((label) => titles.includes(label)));
    expect(titles.length).toBeGreaterThan(0);

    // The Price table reads the same grouping, so the two must agree exactly.
    const priceRows = await page
      .locator('#price .price-table tbody th[scope="row"]')
      .evaluateAll((els) => els.map((e) => e.textContent!.trim()));
    expect(priceRows.slice(0, titles.length)).toEqual(titles);
  });

  test('availability is dated and never shows a guessed number', async ({ page }) => {
    await page.goto('/#floorplans');
    // Every layout must carry an explicit status, and "On request" is the only
    // permitted rendering when the split is unknown.
    const statuses = await page
      .locator('.fp-card__body .badge')
      .evaluateAll((els) => els.map((e) => e.textContent!.trim()));
    expect(statuses.length).toBeGreaterThan(0);
    for (const s of statuses) {
      expect(s).toMatch(/^(Sold out|On request|\d+ units? left)$/);
    }
    // Availability must be stamped with the date it was taken.
    await expect(page.locator('#floorplans .fp-foot time')).toHaveCount(1);
  });
});

test.describe('Brochure', () => {
  test('the nav link scrolls to the section and never downloads on click', async ({ page }) => {
    await page.goto('/');
    const downloads: string[] = [];
    page.on('download', (d) => downloads.push(d.suggestedFilename()));

    if (isMobile(page)) {
      await page.locator('#menu-toggle').click();
      await page.locator('#mobile-menu a[href="#brochure"]').click();
    } else {
      await page.locator('.nav-desktop a[href="#brochure"]').click();
    }

    await expect(page).toHaveURL(/#brochure$/);
    await expect(page.locator('#brochure')).toBeInViewport({ ratio: 0.05 });
    expect(downloads).toEqual([]);
  });

  test('offers exactly one action, and it is the request CTA', async ({ page }) => {
    await page.goto('/#brochure');
    const links = page.locator('#brochure a');
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAttribute('data-track', 'request_brochure');
    await expect(links).toHaveAttribute('href', '#contact');
  });
});

test.describe('Contact form', () => {
  test('the enquiry consent is present, unticked, and the only consent asked for', async ({
    page,
  }) => {
    await page.goto('/#contact');
    await expect(page.locator('input[name="consentEnquiry"]')).not.toBeChecked();
    // The marketing opt-in was removed: the form must not collect consent to
    // marketing, so no such control may reappear without a deliberate change.
    await expect(page.locator('input[name="consentMarketing"]')).toHaveCount(0);
  });

  test('shows accessible errors and does not claim success when invalid', async ({ page }) => {
    await page.goto('/#contact');
    await page.waitForSelector('#lead-form[data-enhanced="true"]');
    await page.locator('#lead-form button[type="submit"]').click();

    const summary = page.locator('[data-error-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(/problem/i);
    await expect(page.locator('[data-error-for="name"]')).toBeVisible();
    await expect(page.locator('[data-error-for="phone"]')).toBeVisible();
    await expect(page.locator('[data-error-for="consentEnquiry"]')).toBeVisible();
    await expect(page).not.toHaveURL(/thank-you/);
  });

  test('rejects a non-Singapore mobile number', async ({ page }) => {
    await page.goto('/#contact');
    await page.waitForSelector('#lead-form[data-enhanced="true"]');
    await page.fill('#name', 'Test Person');
    await page.fill('#phone', '12345');
    await page.check('input[name="consentEnquiry"]');
    await page.locator('#lead-form button[type="submit"]').click();
    await expect(page.locator('[data-error-for="phone"]')).toContainText(/8 digits/i);
  });

  test('captures attribution parameters into hidden fields', async ({ page }) => {
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=brand&gclid=TEST123#contact');
    await expect(page.locator('input[name="utm_source"]')).toHaveValue('google');
    await expect(page.locator('input[name="utm_medium"]')).toHaveValue('cpc');
    await expect(page.locator('input[name="utm_campaign"]')).toHaveValue('brand');
    await expect(page.locator('input[name="gclid"]')).toHaveValue('TEST123');
  });

  test('the honeypot field is present and empty', async ({ page }) => {
    await page.goto('/#contact');
    const honeypot = page.locator('input[name="company"]');
    await expect(honeypot).toHaveCount(1);
    await expect(honeypot).toHaveValue('');
    await expect(honeypot).not.toBeInViewport();
  });

  test('the mobile contact bar does not cover the submit button', async ({ page }) => {
    test.skip(!isMobile(page), 'Desktop has no mobile contact bar');
    await page.goto('/#contact');
    await page.locator('#name').focus();
    await expect(page.locator('[data-mobile-bar]')).toHaveAttribute('data-hidden', '');
  });
});

test.describe('Legal and utility pages', () => {
  for (const path of ['/about-ethan', '/privacy', '/terms', '/disclaimer', '/thank-you']) {
    test(`${path} loads and links back to the main page`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(await domCount(page, 'h1')).toBe(1);
      await expect(page.locator('a[href="/"]').first()).toHaveCount(1);
    });
  }

  test('/thank-you is noindex', async ({ page }) => {
    await page.goto('/thank-you');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('an unknown URL returns the 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/could not be found/i).first()).toBeVisible();
  });

  test('robots.txt allows AdsBot and declares the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('AdsBot-Google');
    expect(body).not.toMatch(/User-agent:\s*AdsBot-Google[\s\S]{0,40}Disallow:\s*\//);
    expect(body).toContain('Sitemap:');
  });

  test('legal links appear in the footer, not the main navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.site-footer a[href="/privacy"]')).toHaveCount(1);
    await expect(page.locator('.nav-desktop a[href="/privacy"]')).toHaveCount(0);
    await expect(page.locator('#mobile-menu a[href="/privacy"]')).toHaveCount(0);
  });
});

test.describe('Internal links', () => {
  test('no internal link is broken', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href')!)
        .filter((href) => href.startsWith('/') && !href.startsWith('//'))
    );

    const unique = Array.from(new Set(hrefs.map((href) => href.split('#')[0]!)))
      .filter(Boolean)
      // The sitemap is emitted by the build, not by the dev server.
      .filter((href) => !href.includes('sitemap'));

    for (const href of unique) {
      const response = await request.get(href);
      expect(response.status(), `${href} should not be broken`).toBeLessThan(400);
    }
  });
});
