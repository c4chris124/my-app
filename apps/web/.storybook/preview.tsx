import { Suspense } from "react";
import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import "../src/index.css"; // Tailwind layers + design tokens, available to every story
import "../src/i18n"; // initialize i18next so useTranslation works in stories

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
  },
  decorators: [
    // Outermost: i18next loads translations async, so stories may suspend.
    (Story) => (
      <Suspense fallback={null}>
        <Story />
      </Suspense>
    ),
    // Toolbar switch between the light and dark design tokens.
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
