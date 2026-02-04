import { Instagram, Facebook, MapPin, Phone, Mail, Clock, FileText, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const Footer = () => {
  const { language } = useLanguage();

  const socialLinks = [
    {
      icon: Instagram,
      href: 'https://instagram.com/jaro_fyziofit',
      label: 'Instagram',
      color: 'hover:text-pink-500',
    },
    {
      icon: Facebook,
      href: 'https://www.facebook.com/Jaro.Begala/',
      label: 'Facebook',
      color: 'hover:text-blue-600',
    },
  ];

  const contactInfo = [
    {
      icon: MapPin,
      text: 'Krmanová 6, Košice',
      href: 'https://maps.google.com/?q=Krmanová+6,+Košice',
    },
    {
      icon: Phone,
      text: '+421 905 307 198',
      href: 'tel:+421905307198',
    },
    {
      icon: Mail,
      text: 'info@fyziofit.sk',
      href: 'mailto:info@fyziofit.sk',
    },
    {
      icon: Clock,
      text: language === 'sk' ? 'Po-Pi: 8:00 - 18:00' : 'Mon-Fri: 8:00 - 18:00',
      href: null,
    },
  ];

  return (
    <footer className="w-full border-t border-border/30 bg-gradient-to-b from-background/80 to-background backdrop-blur-xl mt-auto relative z-20">
      {/* Decorative top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-5 lg:gap-6">
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              const content = (
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl",
                  "glass-card text-xs sm:text-sm text-muted-foreground",
                  "hover:text-foreground hover:shadow-md hover:-translate-y-0.5",
                  "transition-all duration-300 active:scale-[0.98]",
                  "group"
                )}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <span className="whitespace-nowrap font-medium">{item.text}</span>
                </div>
              );

              return item.href ? (
                <a
                  key={index}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                >
                  {content}
                </a>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>

          {/* Social Links & Language Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Social Icons - Enhanced */}
            <div className="inline-flex items-center rounded-xl glass-card p-1.5 sm:p-2 gap-1">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-lg text-muted-foreground",
                      "hover:bg-primary/10 transition-all duration-300",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "active:scale-90 group",
                      social.color
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                  </a>
                );
              })}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>

        {/* Legal Links & Copyright */}
        <div className="mt-6 pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 sm:gap-6">
            <Link
              to="/legal?tab=terms"
              className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">{language === 'sk' ? 'Obchodné podmienky' : 'Terms of Service'}</span>
            </Link>
            <Link
              to="/legal?tab=privacy"
              className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <Shield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">{language === 'sk' ? 'Ochrana údajov' : 'Privacy Policy'}</span>
            </Link>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
            <span>© {new Date().getFullYear()}</span>
            <span className="font-bold text-foreground">FYZIO&FIT</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center gap-1">
              {language === 'sk' ? 'S' : 'Made with'}
              <Heart className="w-3 h-3 text-destructive fill-destructive animate-pulse" />
              {language === 'sk' ? 'pre vaše zdravie' : 'for your health'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;