import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';
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
    <footer className="w-full border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              const content = (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200">
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
                </div>
              );

              return item.href ? (
                <a
                  key={index}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
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
            <div className="inline-flex items-center rounded-full border border-border bg-card p-1 gap-1">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
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

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FYZIO&FIT. {language === 'sk' ? 'Všetky práva vyhradené.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
