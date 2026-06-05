import type { IconType } from "react-icons";
import { IconBadge, type IconBadgeTone } from "./IconBadge";

interface InfoCardProps {
  icon: IconType;
  tone?: IconBadgeTone;
  title: string;
  body: string;
  className?: string;
}

/**
 * Molecule — bordered panel with an icon badge, heading and body copy. Composes
 * {@link IconBadge}. Used for the Mission / Vision pair, but generic enough for
 * any "feature" style card.
 */
export function InfoCard({
  icon,
  tone,
  title,
  body,
  className = "",
}: InfoCardProps) {
  return (
    <article
      className={`flex flex-col rounded-lg border border-outline-variant bg-surface-container p-stack-lg shadow-card transition-shadow hover:shadow-panel ${className}`}
    >
      <IconBadge icon={icon} tone={tone} className="mb-stack-lg" />
      <h3 className="mb-stack-md font-heading text-headline-md tracking-wide text-on-surface">
        {title}
      </h3>
      <p className="font-body text-body-md leading-relaxed text-on-surface-variant">
        {body}
      </p>
    </article>
  );
}
