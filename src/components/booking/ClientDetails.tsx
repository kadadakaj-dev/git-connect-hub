import { User, Mail, Phone, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface ClientDetailsProps {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  onUpdate: (field: string, value: string) => void;
  errors: Record<string, string>;
}

const ClientDetails = ({
  clientName,
  clientEmail,
  clientPhone,
  notes,
  onUpdate,
  errors,
}: ClientDetailsProps) => {
  const { t } = useLanguage();

  const inputClasses = (hasError: boolean) => cn(
    "w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border bg-background/60 text-foreground text-sm sm:text-base",
    "placeholder:text-muted-foreground/50 transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-background",
    "hover:border-primary/30 hover:bg-background/80",
    hasError ? "border-destructive/50 bg-destructive/5 focus:ring-destructive/30" : "border-border"
  );

  const iconClasses = "absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary";

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
          {t.yourDetails}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          {t.provideContactInfo}
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
          {/* Name Field */}
          <div className="group">
            <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t.fullName} <span className="text-primary font-normal">{t.required}</span>
            </label>
            <div className="relative">
              <User className={iconClasses} />
              <input
                id="name"
                type="text"
                value={clientName}
                onChange={(e) => onUpdate('clientName', e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className={inputClasses(!!errors.clientName)}
              />
            </div>
            {errors.clientName && (
              <p className="text-xs sm:text-sm text-destructive mt-1.5 flex items-center gap-1.5 animate-slide-up">
                <span className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                {errors.clientName}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="group">
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t.emailAddress} <span className="text-primary font-normal">{t.required}</span>
            </label>
            <div className="relative">
              <Mail className={iconClasses} />
              <input
                id="email"
                type="email"
                value={clientEmail}
                onChange={(e) => onUpdate('clientEmail', e.target.value)}
                placeholder={t.emailPlaceholder}
                className={inputClasses(!!errors.clientEmail)}
              />
            </div>
            {errors.clientEmail && (
              <p className="text-xs sm:text-sm text-destructive mt-1.5 flex items-center gap-1.5 animate-slide-up">
                <span className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                {errors.clientEmail}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="group">
            <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t.phoneNumber} <span className="text-primary font-normal">{t.required}</span>
            </label>
            <div className="relative">
              <Phone className={iconClasses} />
              <input
                id="phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => onUpdate('clientPhone', e.target.value)}
                placeholder={t.phonePlaceholder}
                className={inputClasses(!!errors.clientPhone)}
              />
            </div>
            {errors.clientPhone && (
              <p className="text-xs sm:text-sm text-destructive mt-1.5 flex items-center gap-1.5 animate-slide-up">
                <span className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                {errors.clientPhone}
              </p>
            )}
          </div>

          {/* Notes Field */}
          <div className="group">
            <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              {t.additionalNotes}
              <span className="text-muted-foreground font-normal ml-1">({t.optional})</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 sm:left-4 top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => onUpdate('notes', e.target.value)}
                placeholder={t.notesPlaceholder}
                rows={3}
                className={cn(
                  "w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border bg-background/60 text-foreground text-sm sm:text-base",
                  "placeholder:text-muted-foreground/50 transition-all duration-200 resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-background",
                  "hover:border-primary/30 hover:bg-background/80 border-border"
                )}
              />
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="pt-4 border-t border-border/40">
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed">
              {t.privacyNotice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
