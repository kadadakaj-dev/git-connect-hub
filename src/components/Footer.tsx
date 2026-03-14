import { Instagram, Facebook, MapPin, Phone, Mail, Clock, FileText, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/i18n/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/jaro_fyziofit', label: 'Instagram' },
    { icon: Facebook, href: 'https://www.facebook.com/Jaro.Begala/', label: 'Facebook' },
  ];

  const contactInfo = [
    { icon: MapPin, text: 'Krmanová 6, Košice', href: 'https://maps.google.com/?q=Krmanová+6,+Košice' },
    { icon: Phone, text: '+421 905 307 198', href: 'tel:+421905307198' },
    { icon: Mail, text: 'booking@fyzioafit.sk', href: 'mailto:booking@fyzioafit.sk' },
    { icon: Clock, text: language === 'sk' ? 'Po-Pi: 9:30 - 18:30' : 'Mon-Fri: 9:30 - 18:30', href: null },
  ];

  return (
    <footer className="w-full border-t border-border/30 bg-background/60 backdrop-blur-xl mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4">
          {/* Contact */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-5">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              const content = (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
                  <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{item.text}</span>
                </span>
              );
              return item.href ? (
                <a key={index} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                  {content}
                </a>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>

          {/* Social & Language */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a key={index} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                    className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-all duration-200">
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Legal */}
        <div className="mt-5 pt-4 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <Link to="/legal?tab=terms" className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-200">
              <FileText className="w-3 h-3" />
              <span>{language === 'sk' ? 'Obchodné podmienky' : 'Terms of Service'}</span>
            </Link>
            <Link to="/legal?tab=privacy" className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-200">
              <Shield className="w-3 h-3" />
              <span>{language === 'sk' ? 'Ochrana údajov' : 'Privacy Policy'}</span>
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            © {new Date().getFullYear()} <span className="font-semibold text-foreground">FYZIO&FIT</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center gap-1">
              {language === 'sk' ? 'S' : 'Made with'}
              <Heart className="w-3 h-3 text-primary fill-primary" />
              {language === 'sk' ? 'pre vaše zdravie' : 'for your health'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
