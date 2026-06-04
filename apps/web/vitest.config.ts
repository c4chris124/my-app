import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";

const dirname = import.meta.dirname;

export default defineConfig({
  test: {
    projects: [
      {
        // ── Unit tests: plain Vitest (node + jsdom via per-file docblock) ──
        plugins: [react()],
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["src/**/*.stories.*", "node_modules/**"],
        },
      },
      {
        // ── Storybook interaction tests: real browser via Playwright ──
        // @storybook/addon-vitest (SB 10.3+) auto-applies the preview
        // annotations (decorators, theme, i18n, global CSS) to each story.
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
