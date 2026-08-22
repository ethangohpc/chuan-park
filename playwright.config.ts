import { defineConfig, devices } from '@playwright/test';

/**
 * Lightweight end-to-end checks. They start the dev server automatically, so
 * `npm test` is all that is needed after `npm install && npx playwright install`.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  /*
   * The suite runs on its own port, not the 4321 you get from `npm run dev`.
   *
   * With `reuseExistingServer`, Playwright will happily adopt a dev server that
   * is already listening — and a hand-started one lacks the environment below,
   * so the anti-spam timing screen fires and the form tests fail for reasons
   * that have nothing to do with the code. Separate ports mean the two never
   * meet, and you can keep a preview open while the tests run.
   */
  use: {
    baseURL: 'http://localhost:4331',
    trace: 'on-first-retry',

    /*
     * The page scrolls smoothly by default, which means an element Playwright
     * has just scrolled to keeps moving for the length of the animation — it
     * reports "element is not stable" and eventually times out, with the click
     * landing on whatever is under the cursor mid-scroll.
     *
     * global.css already turns smooth scrolling off under prefers-reduced-
     * motion, so asking for it here gives deterministic instant scrolling and
     * exercises a code path real users have. It is not a test-only hack.
     */
    contextOptions: { reducedMotion: 'reduce' },
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  webServer: {
    // ASTRO_DEV_BACKGROUND: Astro 7 daemonises `astro dev` when it detects a
    //   non-interactive or agent-driven environment. Playwright needs a
    //   foreground process, so opt out explicitly.
    // --ignore-lock: Astro 7 refuses to start when it finds a dev-server lock
    //   file, which breaks the suite if a dev server is already open or a
    //   previous one was killed without cleaning up.
    // LEAD_RATE_LIMIT_MAX: the suite submits the form several times from one
    //   IP; production keeps the real limit.
    // LEAD_MIN_FILL_SECONDS: the bot timing heuristic would otherwise make
    //   form assertions depend on how fast the machine runs.
    // ASTRO_DEV_TOOLBAR: the dev toolbar injects headings and controls of its
    //   own, which Playwright sees through shadow DOM and counts as page
    //   content.
    command:
      'ASTRO_DEV_BACKGROUND=0 ASTRO_DEV_TOOLBAR=false LEAD_RATE_LIMIT_MAX=1000 LEAD_MIN_FILL_SECONDS=0 npx astro dev --ignore-lock --port 4331',
    url: 'http://localhost:4331',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
