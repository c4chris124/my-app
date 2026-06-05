import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary";

const VARIANTS: Record<ButtonVariant, string> = {
  // Energy Yellow CTA with charcoal text — soft elevation that lifts on hover.
  primary: "bg-accent text-accent-on shadow-panel hover:shadow-card",
  // Primary Dark Blue outline, fills on hover.
  secondary:
    "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-on-primary",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Soft button: rounded corners, Montserrat bold, 48px tall touch target.
 */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`h-12 rounded px-stack-lg font-body text-body-md font-bold tracking-wide transition-all ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
