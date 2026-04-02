import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations, Language } from './translations';

type TranslationType = typeof translations.sk | typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
}

// Default context value to prevent crashes during hydration
const defaultContextValue: LanguageContextType = {
  language: 'sk',
  setLanguage: () => {},
  t: translations.sk,
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('sk');

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: translations[language],
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  return useContext(LanguageContext);
};
