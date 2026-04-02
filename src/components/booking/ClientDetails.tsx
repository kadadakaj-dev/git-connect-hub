import { useState } from 'react';
import { User, Mail, Phone, FileText, CheckCircle2, AlertCircle, Shield, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { BookingData } from '@/types/booking';
import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';

interface ClientDetailsProps {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  onUpdate: (field: string, value: string) => void;
  errors: Record<string, string>;
  bookingData?: BookingData;
}

const ClientDetails = ({
  clientName,
  clientEmail,
  clientPhone,
  notes,
  onUpdate,
  errors,
  bookingData,
}: ClientDetailsProps) => {
  const { t, language } = useLanguage();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const locale = language === 'sk' ? sk : enUS;

  const isFieldValid = (field: string, value: string) => {
    if (!value.trim()) return null;
    switch (field) {
      case 'clientName':
        return value.trim().length >= 2;
      case 'clientEmail':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'clientPhone': return /^[+]?[0-9\s()-]{7,20}$/.test(value.trim());
      default:
        return null;
    }
  };

  const inputClasses = (field: string) => {
    const hasError = !!errors[field];
    return cn(
      "w-full pl-10 pr-10 py-2.5 rounded-md border bg-card text-foreground text-sm",
      "placeholder:text-muted-foreground/40 transition-all duration-200",
      "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
      hasError
        ? "border-destructive/50 bg-destructive/5"
        : "border-border/60 hover:border-muted-foreground/30"
    );
  };

  const renderField = (
    field: string,
    icon: React.ElementType,
    label: string,
    type: string,
    placeholder: string,
    value: string,
    required = true,
    autoComplete?: string
  ) => {
    const Icon = icon;
    const hasError = !!errors[field];
    const isValid = isFieldValid(field, value);
    const isFocused = focusedField === field;

    return (
      <div>
        <label htmlFor={field} className={cn(
          "block text-xs font-medium mb-1.5 transition-colors duration-200",
          isFocused ? "text-primary" : "text-foreground"
        )}>
          {label}
          {required && <span className="text-primary ml-1">{t.required}</span>}
          {!required && <span className="text-muted-foreground ml-1">({t.optional})</span>}
        </label>
        <div className="relative">
          <Icon className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
            isFocused ? "text-primary" : hasError ? "text-destructive" : "text-muted-foreground"
          )} />
          <input
            id={field}
            type={type}
            value={value}
            onChange={(e) => onUpdate(field, e.target.value)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            placeholder={placeholder}
            className={inputClasses(field)}
            autoComplete={autoComplete}
          />
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
            (isValid !== null || hasError) ? "opacity-100" : "opacity-0"
          )}>
            {hasError ? (
              <AlertCircle className="w-4 h-4 text-destructive" />
            ) : isValid === true ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : null}
          </div>
        </div>
        {hasError && (
          <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-destructive" />
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {t.yourDetails}
        </h2>
        <p className="text-muted-foreground text-sm">{t.provideContactInfo}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border/60 rounded-lg p-5 sm:p-6 shadow-soft space-y-4">
            {renderField('clientName', User, t.fullName, 'text', t.fullNamePlaceholder, clientName, true, 'name')}
            {renderField('clientEmail', Mail, t.emailAddress, 'email', t.emailPlaceholder, clientEmail, true, 'email')}
            {renderField('clientPhone', Phone, t.phoneNumber, 'tel', t.phonePlaceholder, clientPhone, true, 'tel')}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className={cn(
                "block text-xs font-medium mb-1.5 transition-colors duration-200",
                focusedField === 'notes' ? "text-primary" : "text-foreground"
              )}>
                {t.additionalNotes}
                <span className="text-muted-foreground ml-1">({t.optional})</span>
              </label>
              <div className="relative">
                <FileText className={cn(
                  "absolute left-3 top-3 w-4 h-4 transition-colors duration-200",
                  focusedField === 'notes' ? "text-primary" : "text-muted-foreground"
                )} />
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => onUpdate('notes', e.target.value)}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.notesPlaceholder}
                  rows={3}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-md border bg-card text-foreground text-sm resize-none",
                    "placeholder:text-muted-foreground/40 transition-all duration-200",
                    "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
                    "border-border/60 hover:border-muted-foreground/30"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Reservation Summary */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-card border border-border/60 rounded-lg p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {language === 'sk' ? 'Zhrnutie rezervácie' : 'Booking Summary'}
            </h3>

            {bookingData?.service && (
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{bookingData.service.name}</p>
                    <p className="text-xs text-muted-foreground">{bookingData.service.duration} {t.min}</p>
                  </div>
                </div>

                {bookingData.date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        {format(bookingData.date, 'd. MMMM yyyy', { locale })}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {format(bookingData.date, 'EEEE', { locale })}
                      </p>
                    </div>
                  </div>
                )}

                {bookingData.time && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="font-medium text-foreground font-data">{bookingData.time}</p>
                  </div>
                )}

                <div className="pt-3 mt-3 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{language === 'sk' ? 'Cena' : 'Price'}</span>
                    <span className="text-lg font-bold text-foreground font-data">{bookingData.service.price}€</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trust badge */}
          <div className="bg-card border border-border/60 rounded-lg p-4 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {language === 'sk'
                  ? 'GDPR • Vaše údaje sú v bezpečí a chránené'
                  : 'GDPR • Your data is safe and protected'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
