// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

/**
 * SITE URL
 * ---------------------------------------------------------------------------
 * The production domain. Used for the canonical URL, Open Graph tags, the
 * sitemap and structured data, and it must match the display domain in your
 * Google Ads account.
 *
 * It is the DEFAULT rather than an environment variable on purpose: Cloudflare
 * Workers Builds would need PUBLIC_SITE_URL added as a build variable in the
 * dashboard, and a domain that only lives in a dashboard is a domain that
 * silently reverts to example.com the day someone rebuilds elsewhere. Set
 * PUBLIC_SITE_URL to override for a staging deploy.
 */
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://chuanpark.rsvp-home.com';

export default defineConfig({
  site: SITE_URL,

  // "server" output with per-page prerendering: every content page is static
  // HTML (fast, crawlable, cheap), while /api/lead runs on Cloudflare Workers
  // so the contact form can be validated on the server.
  output: 'server',
  adapter: cloudflare({
    // Images are pre-optimised WebP in /public, so no transform service is
    // needed — 'passthrough' avoids requiring a Cloudflare Images binding.
    imageService: 'passthrough',
  }),

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thank-you'),
    }),
  ],

  build: {
    inlineStylesheets: 'auto',
  },

  devToolbar: {
    // The dev toolbar injects its own UI (including headings) into the page.
    // Playwright pierces shadow DOM, so it skews element counts, accessibility
    // audits and screenshots. The test server sets ASTRO_DEV_TOOLBAR=false.
    enabled: process.env.ASTRO_DEV_TOOLBAR !== 'false',
  },

  image: {
    // Keep image handling simple and dependency-light. Pre-optimised
    // WebP/AVIF assets are committed to /public — see README.
    service: { entrypoint: 'astro/assets/services/noop' },
  },
});
