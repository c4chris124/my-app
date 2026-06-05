import type { IconType } from "react-icons";

export type IconBadgeTone = "secondary" | "primary";

const TONES: Record<IconBadgeTone, string> = {
  secondary: "border-secondary/30 bg-secondary/10 text-secondary",
  primary: "border-primary/30 bg-primary-container text-primary",
};

/**
 * Atom — circular, bordered icon chip. The round shape is the one exception the
 * otherwise strictly-sharp design system allows (icon-only). `tone` picks the
 * accent colour from the theme tokens.
 */
export function IconBadge({
  icon: Icon,
  tone = "secondary",
  className = "",
}: {
  icon: IconType;
  tone?: IconBadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full border-2 ${TONES[tone]} ${className}`}
    >
      <Icon aria-hidden size={24} />
    </span>
  );
}
