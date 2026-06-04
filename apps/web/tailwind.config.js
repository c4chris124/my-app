/** @type {import('tailwindcss').Config} */

// All colors are driven by CSS custom properties defined in src/index.css.
// `<alpha-value>` lets Tailwind opacity modifiers (e.g. bg-primary/20) work,
// which is why the variables are stored as space-separated RGB channels.
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // Include shared package if it ever has components
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    // Industrial brand = strictly sharp. Keep `full` only for iconography.
    borderRadius: {
      none: "0px",
      sm: "0px",
      DEFAULT: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "9999px",
    },
    extend: {
      colors: {
        surface: {
          DEFAULT: withAlpha("--surface"),
          dim: withAlpha("--surface-dim"),
          bright: withAlpha("--surface-bright"),
          lowest: withAlpha("--surface-container-lowest"),
          low: withAlpha("--surface-container-low"),
          container: withAlpha("--surface-container"),
          high: withAlpha("--surface-container-high"),
          highest: withAlpha("--surface-container-highest"),
          variant: withAlpha("--surface-variant"),
        },
        "on-surface": {
          DEFAULT: withAlpha("--on-surface"),
          variant: withAlpha("--on-surface-variant"),
        },
        primary: {
          DEFAULT: withAlpha("--primary"),
          container: withAlpha("--primary-container"),
        },
        "on-primary": {
          DEFAULT: withAlpha("--on-primary"),
          container: withAlpha("--on-primary-container"),
        },
        secondary: {
          DEFAULT: withAlpha("--secondary"),
          container: withAlpha("--secondary-container"),
        },
        "on-secondary": {
          DEFAULT: withAlpha("--on-secondary"),
          container: withAlpha("--on-secondary-container"),
        },
        tertiary: {
          DEFAULT: withAlpha("--tertiary"),
          container: withAlpha("--tertiary-container"),
        },
        "on-tertiary": {
          DEFAULT: withAlpha("--on-tertiary"),
          container: withAlpha("--on-tertiary-container"),
        },
        // Brand "Energy Yellow" — CTAs, warnings, machine highlights.
        accent: {
          DEFAULT: withAlpha("--accent"),
          on: withAlpha("--on-accent"),
        },
        error: {
          DEFAULT: withAlpha("--error"),
          container: withAlpha("--error-container"),
        },
        "on-error": {
          DEFAULT: withAlpha("--on-error"),
          container: withAlpha("--on-error-container"),
        },
        outline: {
          DEFAULT: withAlpha("--outline"),
          variant: withAlpha("--outline-variant"),
        },
        background: withAlpha("--background"),
        "on-background": withAlpha("--on-background"),
        inverse: {
          surface: withAlpha("--inverse-surface"),
          "on-surface": withAlpha("--inverse-on-surface"),
          primary: withAlpha("--inverse-primary"),
        },
        // Rectangular status chips: stay vivid in both themes.
        status: {
          available: withAlpha("--status-available"),
          out: withAlpha("--status-out"),
          limited: withAlpha("--status-limited"),
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        heading: ["'Bebas Neue'", "sans-serif"],
        body: ["Montserrat", "system-ui", "sans-serif"],
        accent: ["Syne", "sans-serif"],
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": [
          "48px",
          { lineHeight: "48px", letterSpacing: "0.05em", fontWeight: "700" },
        ],
        "headline-lg": [
          "32px",
          { lineHeight: "32px", letterSpacing: "0.02em", fontWeight: "400" },
        ],
        "headline-md": ["24px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-bold": ["14px", { lineHeight: "20px", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "accent-text": ["18px", { lineHeight: "24px", fontWeight: "600" }],
      },
      spacing: {
        "stack-xs": "4px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "stack-xl": "48px",
        gutter: "16px",
        "margin-mobile": "20px",
        "margin-desktop": "64px",
      },
      maxWidth: {
        container: "1280px",
      },
      boxShadow: {
        // "Depressed into a machine panel" — tight, dark, low blur.
        pressed: "inset 2px 2px 0 0 rgb(17 17 17 / 0.25)",
        panel: "4px 4px 0 0 rgb(17 17 17 / 0.15)",
      },
    },
  },
  plugins: [],
};
