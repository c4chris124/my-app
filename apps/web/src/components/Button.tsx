import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary";

const VARIANTS: Record<ButtonVariant, string> = {
  // Energy Yellow CTA with charcoal text — maximum visibility.
  primary: "bg-accent text-accent-on hover:shadow-pressed",
  // Thick Primary Dark Blue outline, fills on hover.
  secondary:
    "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-on-primary",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Industrial button: sharp corners, Bebas Neue uppercase, 48px tall touch target.
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
      className={`h-12 px-stack-lg font-heading text-headline-md uppercase tracking-wide transition ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
