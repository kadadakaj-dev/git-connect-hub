import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-lg sm:rounded-xl glass-card p-1 sm:p-1.5 gap-0.5 sm:gap-1">
      <button
        onClick={() => setLanguage('sk')}
        className={cn(
          "px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95",
          language === 'sk'
            ? "bg-navy text-navy-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        SK
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95",
          language === 'en'
            ? "bg-navy text-navy-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
