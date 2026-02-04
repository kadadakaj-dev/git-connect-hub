import { Instagram, Facebook, MapPin, Phone, Mail, Clock, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/i18n/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();

  const socialLinks = [
    {
      icon: Instagram,
      href: 'https://instagram.com/jaro_fyziofit',
      label: 'Instagram',
    },
    {
      icon: Facebook,
      href: 'https://www.facebook.com/Jaro.Begala/',
      label: 'Facebook',
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
    <footer className="w-full border-t border-border/40 bg-background/90 backdrop-blur-md mt-auto relative z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 lg:gap-6">
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              const content = (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl glass-card text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.text}</span>
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Social Icons */}
            <div className="inline-flex items-center rounded-lg sm:rounded-xl glass-card p-1 sm:p-1.5 gap-0.5 sm:gap-1">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="p-2 sm:p-2.5 rounded-md sm:rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/12 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>

        {/* Legal Links & Copyright */}
        <div className="mt-5 pt-5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-5">
            <Link
              to="/legal?tab=terms"
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {language === 'sk' ? 'Obchodné podmienky' : 'Terms of Service'}
            </Link>
            <Link
              to="/legal?tab=privacy"
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {language === 'sk' ? 'Ochrana údajov' : 'Privacy Policy'}
            </Link>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            © {new Date().getFullYear()} <span className="font-semibold">FYZIO&FIT</span>. {language === 'sk' ? 'Všetky práva vyhradené.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
