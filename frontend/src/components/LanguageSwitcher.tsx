import React from 'react';
import { useTranslation } from 'react-i18next';

const flagStyle: React.CSSProperties = {
  fontSize: '1.7rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  margin: '0 0.2rem',
  padding: 0,
  outline: 'none',
  transition: 'transform 0.1s',
};

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ margin: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      <button
        style={flagStyle}
        aria-label="Deutsch"
        onClick={() => changeLanguage('de')}
        title="Deutsch"
      >🇩🇪</button>
      <button
        style={flagStyle}
        aria-label="English"
        onClick={() => changeLanguage('en')}
        title="English"
      >🇬🇧</button>
    </div>
  );
};

export default LanguageSwitcher;
