import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import german from "./locales/german.json";
import english from "./locales/english.json";

const resources = {
  de: { common: german },
  en: { common: english },
};

const getStoredLanguage = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("appLanguage");
};

const detectInitialLanguage = (): string => {
  const stored = getStoredLanguage();
  if (stored && ["de", "en"].includes(stored)) return stored;

  if (typeof navigator !== "undefined") {
    const browser = navigator.language?.slice(0, 2);
    if (browser && ["de", "en"].includes(browser)) return browser;
  }

  return "de";
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: "en",
  supportedLngs: ["de", "en"],
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("appLanguage", lng);
  }
});

export default i18n;
