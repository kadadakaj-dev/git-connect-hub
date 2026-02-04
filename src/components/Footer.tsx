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
    <footer className="w-full border-t border-border/50 bg-background/80 backdrop-blur-lg mt-auto relative z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 lg:gap-8">
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              const content = (
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl glass-card text-sm text-muted-foreground hover:text-foreground transition-all duration-200">
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.text}</span>
                </div>
              );

              return item.href ? (
                <a
                  key={index}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
                >
                  {content}
                </a>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>

          {/* Social Links & Language Switcher */}
          <div className="flex items-center gap-3">
            {/* Social Icons */}
            <div className="inline-flex items-center rounded-xl glass-card p-1.5 gap-1">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="p-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
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
        <div className="mt-6 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/legal?tab=terms"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {language === 'sk' ? 'Obchodné podmienky' : 'Terms of Service'}
            </Link>
            <Link
              to="/legal?tab=privacy"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              {language === 'sk' ? 'Ochrana údajov' : 'Privacy Policy'}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} <span className="font-semibold">FYZIO&FIT</span>. {language === 'sk' ? 'Všetky práva vyhradené.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
