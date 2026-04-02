import { Link } from 'react-router-dom';
import { User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

const BookingHeader = () => {
  const { language } = useLanguage();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div className="surface-toolbar container max-w-2xl mx-auto px-4 h-14 flex items-center justify-between border border-[var(--glass-border-subtle)] shadow-glass-soft shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <a href="/" className="text-sm font-semibold text-[hsl(var(--soft-navy))] tracking-[0.18em] hover:text-[hsl(var(--navy))] transition-colors duration-200">
          FYZIO&FIT
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile: show phone icon only */}
          <a
            href="tel:+421905307198"
            className="sm:hidden p-2 rounded-xl text-muted-foreground hover:text-[hsl(var(--navy))] hover:bg-white/70 transition-all duration-200"
            aria-label={language === 'sk' ? 'Zavolať' : 'Call us'}
          >
            <Phone className="w-4 h-4" />
          </a>
          {/* Desktop: show full contact info */}
          <a href="tel:+421905307198" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[hsl(var(--soft-navy))] transition-colors">
            <Phone className="w-3 h-3" />
            <span>+421 905 307 198</span>
          </a>
          <a href="mailto:booking@fyzioafit.sk" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[hsl(var(--soft-navy))] transition-colors">
            <Mail className="w-3 h-3" />
            <span>booking@fyzioafit.sk</span>
          </a>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-[hsl(var(--soft-navy))] hover:bg-white/70 h-8 px-3 rounded-xl">
            <Link to="/auth" aria-label={language === 'sk' ? 'Klientský portál' : 'Client Portal'}>
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">
                {language === 'sk' ? 'Klientský portál' : 'Client Portal'}
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default BookingHeader;
