import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import german from './locales/german.json';
import english from './locales/english.json';

const resources = {
  de: { translation: german },
  en: { translation: english },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de', // Standardsprache
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
