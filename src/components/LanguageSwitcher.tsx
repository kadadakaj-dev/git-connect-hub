import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1 gap-1">
      <button
        onClick={() => setLanguage('sk')}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          language === 'sk'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        SK
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          language === 'en'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
