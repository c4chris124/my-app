import { useTranslation } from "react-i18next";
import { MdOutlineGTranslate } from "react-icons/md";

const LANGUAGES = ["es", "en"] as const;

function App() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="flex">
      <section id="center">
        <div>
          <div className="lang-switch flex items-center gap-2">
            <MdOutlineGTranslate aria-hidden />
            {LANGUAGES.map(lng => (
              <button
                key={lng}
                type="button"
                onClick={() => i18n.changeLanguage(lng)}
                aria-pressed={current === lng}
                className={
                  current === lng ? "font-bold underline" : "opacity-60"
                }
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <h1>{t("welcome")}</h1>
        </div>
      </section>
    </div>
  );
}

export default App;
