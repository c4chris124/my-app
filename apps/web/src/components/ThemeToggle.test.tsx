// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeToggle } from "./ThemeToggle";
import { useThemeStore } from "../theme/themeStore";

const isDarkOnHtml = () =>
  document.documentElement.classList.contains("dark");

beforeEach(() => {
  localStorage.clear();
  // Deterministic starting point: light mode, class cleared.
  useThemeStore.getState().setMode("light");
});

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("renders a real <button> (not a div) so it stays keyboard-accessible", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.tagName).toBe("BUTTON");
    // type=button so it never accidentally submits a surrounding form
    expect(btn).toHaveAttribute("type", "button");
  });

  it("starts in light mode", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveTextContent("LIGHT");
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(isDarkOnHtml()).toBe(false);
  });

  it("switches to dark on click — label, aria, <html> class and storage all update", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("DARK");
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(isDarkOnHtml()).toBe(true);
    expect(localStorage.getItem("rehobot-theme")).toBe("dark");
  });

  // Guards against the toggle getting "stuck" on one mode.
  it("toggles back to light on a second click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");

    await user.click(btn);
    expect(isDarkOnHtml()).toBe(true);

    await user.click(btn);
    expect(btn).toHaveTextContent("LIGHT");
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(isDarkOnHtml()).toBe(false);
    expect(localStorage.getItem("rehobot-theme")).toBe("light");
  });

  // Guards against a button that stops flipping after the first interaction.
  it("alternates on every click instead of sticking", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");

    const seen: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      await user.click(btn);
      seen.push(isDarkOnHtml());
    }

    // dark, light, dark, light — never two of the same in a row
    expect(seen).toEqual([true, false, true, false]);
  });

  // Guards against breaking the shared store: two toggles must stay in sync.
  it("keeps multiple toggles in sync via the shared store", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ThemeToggle />
        <ThemeToggle />
      </>,
    );
    const [first, second] = screen.getAllByRole("button");

    await user.click(first);

    expect(first).toHaveTextContent("DARK");
    expect(second).toHaveTextContent("DARK");
    expect(isDarkOnHtml()).toBe(true);
  });
});
