import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test as base, expect, type Page } from '@playwright/test';

interface Fixtures {
  /** Saves a full-page screenshot to apps/e2e/screenshots/<name>.png for visual review. */
  capture: (name: string) => Promise<void>;
}

/**
 * Every test fails if the page logs a console error or throws, so silent breakage (a failed
 * request, a React warning turned error, a runtime exception) can't pass unnoticed.
 */
export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console error: ${message.text()}`);
    });
    await use(page);
    expect(errors, 'the browser reported errors').toEqual([]);
  },

  capture: async ({ page }, use, testInfo) => {
    const dir = path.join(import.meta.dirname, '..', 'screenshots');
    mkdirSync(dir, { recursive: true });
    await use(async (name: string) => {
      const file = path.join(dir, `${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await testInfo.attach(name, { path: file, contentType: 'image/png' });
    });
  },
});

export { expect };
export type { Page };

/** A value no other test (or test run) will produce. See "Testing rules" in AGENTS.md. */
export function unique(label: string): string {
  return `${label} ${randomUUID().slice(0, 8)}`;
}
