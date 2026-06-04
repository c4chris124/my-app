import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The ThemeToggle flips the global `.dark` class on <html> and persists the
 * choice. Clicking it in the canvas re-themes the whole Storybook preview.
 */
const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnSurfacePanel: Story = {
  render: () => (
    <div className="border-2 border-on-surface bg-surface-container p-stack-xl">
      <ThemeToggle />
    </div>
  ),
};

/**
 * Interaction test (runs in a real browser via @storybook/addon-vitest, and
 * step-by-step in the Storybook Interactions panel). Mirrors the unit test:
 * the toggle must flip light↔dark on every click — never get stuck.
 */
export const TogglesOnClick: Story = {
  name: "Interaction: toggles light ↔ dark",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    const html = document.documentElement;

    await step("normalize to light mode", async () => {
      if (html.classList.contains("dark")) {
        await userEvent.click(button);
      }
      await expect(button).toHaveTextContent("LIGHT");
      await expect(html).not.toHaveClass("dark");
    });

    await step("click switches to dark", async () => {
      await userEvent.click(button);
      await expect(button).toHaveTextContent("DARK");
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(html).toHaveClass("dark");
    });

    await step("click again switches back (not stuck)", async () => {
      await userEvent.click(button);
      await expect(button).toHaveTextContent("LIGHT");
      await expect(button).toHaveAttribute("aria-pressed", "false");
      await expect(html).not.toHaveClass("dark");
    });
  },
};
