import type { Preview } from "@storybook/react-vite";
import "../src/index.css"; // Tailwind layers, available to every story
import "../src/i18n"; // initialize i18next so useTranslation works in stories

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
