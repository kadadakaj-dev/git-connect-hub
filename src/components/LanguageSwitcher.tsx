import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-xl glass-card p-1.5 gap-1">
      <button
        onClick={() => setLanguage('sk')}
        className={cn(
          "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          language === 'sk'
            ? "bg-navy text-navy-foreground shadow-md"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        SK
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          language === 'en'
            ? "bg-navy text-navy-foreground shadow-md"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
