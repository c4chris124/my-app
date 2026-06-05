import { Eyebrow } from "./Eyebrow";

interface SectionHeadingProps {
  /** Optional uppercase kicker above the title. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * Molecule — the standard section intro: optional eyebrow, a display title and
 * an optional supporting paragraph. Composes the {@link Eyebrow} atom. Reused by
 * any section that needs a heading block (team, etc.).
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={`flex flex-col gap-stack-sm ${centered ? "items-center text-center" : ""} ${className}`}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-display text-display-lg text-on-surface">{title}</h2>
      {subtitle && (
        <p
          className={`font-body text-body-md text-on-surface-variant ${centered ? "max-w-xl" : "max-w-2xl"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
