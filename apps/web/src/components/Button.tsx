import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

// Shared across every variant/shape combination: layout, sizing, typography, disabled state.
const BASE_BUTTON_STYLES =
  "inline-flex h-12 items-center justify-center gap-stack-sm px-stack-lg font-body text-body-md font-bold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-60";

// Solid (filled) color treatment per variant — the default look.
const SOLID_VARIANT_STYLES: Record<ButtonVariant, string> = {
  // Energy Yellow CTA with charcoal text — soft elevation that lifts on hover.
  primary: "bg-accent text-accent-on shadow-panel hover:shadow-card",
  secondary: "bg-secondary text-on-secondary shadow-panel hover:shadow-card",
};

// Outline (transparent) color treatment per variant — border fills solid on hover.
const OUTLINE_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-accent bg-transparent text-accent hover:bg-accent hover:text-accent-on",
  secondary:
    "border-2 border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-on-secondary",
};

const SHAPE_STYLES = {
  default: "rounded",
  rounded: "rounded-full",
};

// Decorative icon wrapper — keeps icons vertically centered without consumer-managed margins.
const ICON_WRAPPER_STYLES = "inline-flex shrink-0 items-center";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isRounded?: boolean;
  isOutline?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function getButtonClassName({
  variant,
  isOutline,
  isRounded,
  className,
}: Required<Pick<ButtonProps, "variant" | "isOutline" | "isRounded">> & {
  className: string;
}) {
  const variantStyles = isOutline
    ? OUTLINE_VARIANT_STYLES[variant]
    : SOLID_VARIANT_STYLES[variant];
  const shapeStyles = isRounded ? SHAPE_STYLES.rounded : SHAPE_STYLES.default;

  return [BASE_BUTTON_STYLES, variantStyles, shapeStyles, className]
    .filter(Boolean)
    .join(" ");
}

/**
 * Base button for the design system: 48px touch target, Montserrat bold.
 * Composable via `isOutline`/`isRounded`/`leftIcon`/`rightIcon` — extend this
 * rather than creating new button components (IconButton, SplitButton, ...).
 */
export function Button({
  variant = "primary",
  isRounded = false,
  isOutline = false,
  leftIcon,
  rightIcon,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClassName({ variant, isOutline, isRounded, className })}
      {...props}
    >
      {leftIcon && (
        <span className={ICON_WRAPPER_STYLES} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span className={ICON_WRAPPER_STYLES} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
