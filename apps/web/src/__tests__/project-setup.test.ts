import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// `yarn workspace @myapp/web test` runs vitest with the cwd at the package root.
const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), "utf-8");
const readJson = (p: string) => JSON.parse(read(p));

const pkg = readJson("package.json");
const deps: Record<string, string> = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

describe("Tailwind CSS is configured", () => {
  it("has tailwind + postcss toolchain installed", () => {
    expect(deps).toHaveProperty("tailwindcss");
    expect(deps).toHaveProperty("autoprefixer");
    expect(deps).toHaveProperty("postcss");
  });

  it("has a tailwind config that scans the source files", () => {
    expect(existsSync(resolve(root, "tailwind.config.js"))).toBe(true);
    expect(read("tailwind.config.js")).toContain("./src/**/*.{ts,tsx}");
  });

  it("wires tailwind into postcss", () => {
    expect(existsSync(resolve(root, "postcss.config.js"))).toBe(true);
    expect(read("postcss.config.js")).toContain("tailwindcss");
  });

  it("imports the tailwind layers in the global stylesheet", () => {
    const css = read("src/index.css");
    expect(css).toContain("@tailwind base");
    expect(css).toContain("@tailwind components");
    expect(css).toContain("@tailwind utilities");
  });
});

describe("i18n translations are configured", () => {
  it("has the i18next toolchain installed", () => {
    expect(deps).toHaveProperty("i18next");
    expect(deps).toHaveProperty("react-i18next");
    expect(deps).toHaveProperty("i18next-http-backend");
    expect(deps).toHaveProperty("i18next-browser-languagedetector");
  });

  it("has an i18n setup module", () => {
    expect(existsSync(resolve(root, "src/i18n.ts"))).toBe(true);
    const cfg = read("src/i18n.ts");
    expect(cfg).toContain("initReactI18next");
    expect(cfg).toMatch(/loadPath/);
  });

  const locales = ["es", "en"] as const;

  it.each(locales)("has a %s/translation.json locale file", (lng) => {
    expect(
      existsSync(resolve(root, `public/locales/${lng}/translation.json`)),
    ).toBe(true);
  });

  it("has matching keys across all locales", () => {
    const keysByLng = locales.map((lng) =>
      Object.keys(readJson(`public/locales/${lng}/translation.json`)).sort(),
    );
    // every locale exposes the same set of translation keys
    for (const keys of keysByLng) {
      expect(keys).toEqual(keysByLng[0]);
    }
    expect(keysByLng[0]).toContain("welcome");
  });
});

describe("Storybook is configured", () => {
  it("has storybook installed", () => {
    expect(deps).toHaveProperty("storybook");
    expect(deps).toHaveProperty("@storybook/react-vite");
  });

  it("has a .storybook config with a main entry", () => {
    const hasMain = ["main.ts", "main.js", "main.cjs", "main.mjs"].some((f) =>
      existsSync(resolve(root, ".storybook", f)),
    );
    expect(hasMain).toBe(true);
  });

  it("exposes storybook scripts", () => {
    const scripts = pkg.scripts ?? {};
    const values = Object.values(scripts).join(" ");
    expect(values).toContain("storybook");
  });
});
