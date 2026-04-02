import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'cookie-consent';

const CookieBanner = () => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
    // Remove Plausible if declined
    const plausibleScript = document.querySelector('script[data-domain]');
    if (plausibleScript) plausibleScript.remove();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-2xl mx-auto glass-card rounded-2xl p-4 sm:p-5 shadow-xl border border-border/50">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'sk'
                ? 'Táto stránka používa cookies a analytiku pre zlepšenie vašej skúsenosti.'
                : 'This site uses cookies and analytics to improve your experience.'}
              {' '}
              <Link to="/legal?tab=privacy" className="text-primary hover:underline font-medium">
                {language === 'sk' ? 'Viac informácií' : 'Learn more'}
              </Link>
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={accept} className="rounded-xl text-xs">
                {language === 'sk' ? 'Súhlasím' : 'Accept'}
              </Button>
              <Button size="sm" variant="ghost" onClick={decline} className="rounded-xl text-xs">
                {language === 'sk' ? 'Odmietnuť' : 'Decline'}
              </Button>
            </div>
          </div>
          <button onClick={decline} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
