import { useTranslation } from "react-i18next";
import { MdOutlineGTranslate } from "react-icons/md";

const LANGUAGES = ["es", "en"] as const;

/**
 * Compact ES/EN language switch. Mirrors the industrial control aesthetic —
 * the active language is underlined, the rest dimmed until hovered.
 */
export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="flex items-center gap-stack-xs text-on-surface-variant">
      <MdOutlineGTranslate aria-hidden size={20} />
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={`font-body text-label-bold uppercase ${
            current === lng
              ? "text-secondary underline underline-offset-4"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
