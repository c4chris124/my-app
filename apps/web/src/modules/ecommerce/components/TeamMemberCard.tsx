import { MdAlternateEmail } from "react-icons/md";

interface TeamMemberCardProps {
  name: string;
  role: string;
  /** Optional portrait. When omitted, the card falls back to the initial. */
  imageSrc?: string;
  /** When set, a mailto action surfaces on hover/focus. */
  email?: string;
}

/**
 * Molecule — team portrait card: a 4:5 image (de-saturated until hover) with an
 * optional email action, plus name and role. Self-contained so it can be reused
 * in any "people" grid.
 */
export function TeamMemberCard({
  name,
  role,
  imageSrc,
  email,
}: TeamMemberCardProps) {
  return (
    <article className="group">
      <div className="relative mb-stack-md aspect-[4/5] overflow-hidden rounded-lg border border-outline-variant bg-surface-high">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={name}
            className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center font-display text-display-lg text-on-surface-variant"
          >
            {name.charAt(0)}
          </span>
        )}

        {email && (
          // Dark scrim is intentional (not a themed surface): it must stay dark
          // over a full-colour photo in either light or dark mode.
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-stack-md opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
            <a
              href={`mailto:${email}`}
              aria-label={`Email ${name}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded border border-secondary bg-surface text-secondary transition hover:bg-secondary hover:text-on-secondary"
            >
              <MdAlternateEmail aria-hidden size={20} />
            </a>
          </div>
        )}
      </div>

      <h3 className="font-heading text-headline-md tracking-wide text-on-surface">
        {name}
      </h3>
      <p className="font-body text-label-bold uppercase tracking-widest text-secondary">
        {role}
      </p>
    </article>
  );
}
