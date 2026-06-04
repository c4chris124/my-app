import type { Meta, StoryObj } from "@storybook/react-vite";
import { useTranslation } from "react-i18next";

/**
 * A small demo component that proves Tailwind + i18n are wired up:
 * - classes come from Tailwind
 * - the heading text comes from public/locales/{lng}/common.json
 */
function Welcome() {
  const { t, i18n } = useTranslation();

  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">{t("welcome")}</h1>
      <div className="mt-4 flex justify-center gap-2">
        {(["es", "en"] as const).map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            className={`rounded-md px-3 py-1 text-sm font-semibold transition ${
              i18n.resolvedLanguage === lng
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {lng.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "Example/Welcome",
  component: Welcome,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Welcome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
