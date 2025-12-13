import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { 
    code: 'de', 
    flag: '🇩🇪', 
    label: 'Deutsch',
    flagUrl: 'https://flagcdn.com/de.svg' // Deutschland Flagge SVG
  },
  { 
    code: 'en', 
    flag: '🇬🇧', 
    label: 'English',
    flagUrl: 'https://flagcdn.com/gb.svg' // Großbritannien Flagge SVG
  },
];

const DashboardLanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dashboard-lang-switcher" ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* UNVERÄNDERTER BUTTON */}
      <button
        className="theme-toggle"
        title="Sprache wechseln"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          marginLeft: '0.5rem',
          position: 'relative',
        }}
      >
        Sprache
      </button>
      
      {/* DROPDOWN MIT SVG FLAGGEN */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            boxShadow: 'none',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              title={lang.label}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                lineHeight: 1,
                minWidth: '36px',
                minHeight: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* SVG FLAGGE statt Emoji */}
              <img 
                src={lang.flagUrl} 
                alt={lang.label}
                style={{
                  width: '24px',
                  height: '18px',
                  objectFit: 'cover',
                  borderRadius: '2px',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardLanguageSwitcher;