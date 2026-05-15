import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, TranslationKey } from '../lib/i18n';
import { astroDictEn } from '../lib/astroDict';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');

  useEffect(() => {
    try {
      localStorage.setItem('app_language', 'vi');
    } catch (e) {
      console.warn("Could not save language to localStorage");
    }
  }, [language]);

  const t = (key: string): string => {
    if (!key) return '';
    // Exact translation match
    if (translations[language] && (translations[language] as any)[key]) {
      return (translations[language] as any)[key];
    }
    // Astro term formatting for English
    if (language === 'en') {
      // Find and replace known terms in string
      let translatedStr = key;
      Object.keys(astroDictEn).forEach(vnTerm => {
        // Regex to replace exact word boundaries where possible (to avoid replacing parts of words)
        // But since these are mostly single capitalized Vietnamese words, simple replace might suffice,
        // or replace full string matches. Let's do exact match first.
        if (translatedStr === vnTerm) {
          translatedStr = astroDictEn[vnTerm];
        }
      });
      return translatedStr !== key ? translatedStr : key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
