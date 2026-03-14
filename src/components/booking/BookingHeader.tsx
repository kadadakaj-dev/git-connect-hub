import { Link } from 'react-router-dom';
import { User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

const BookingHeader = () => {
  const { language } = useLanguage();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[var(--glass-white-md)] border-b border-[var(--glass-border-subtle)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="container max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <a href="/" className="text-sm font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
          FYZIO&FIT
        </a>
        <div className="flex items-center gap-3">
          <a href="tel:+421905307198" className="hidden sm:flex items-center gap-1 text-[11px] text-foreground/70 hover:text-foreground transition-colors">
            <Phone className="w-3 h-3" />
            <span>+421 905 307 198</span>
          </a>
          <a href="mailto:booking@fyzioafit.sk" className="hidden sm:flex items-center gap-1 text-[11px] text-foreground/70 hover:text-foreground transition-colors">
            <Mail className="w-3 h-3" />
            <span>booking@fyzioafit.sk</span>
          </a>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-foreground/70 hover:text-foreground h-7 px-2">
            <Link to="/auth">
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
