import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend) // loads from /public/locales/
  .use(LanguageDetector) // reads browser language
  .use(initReactI18next)
  .init({
    fallbackLng: "es", // Spanish default for REHOBOT
    supportedLngs: ["es", "en"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
