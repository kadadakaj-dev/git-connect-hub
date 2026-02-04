import { useState, useRef } from 'react';
import { User, Mail, Phone, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const { t, language } = useLanguage();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isFieldValid = (field: string, value: string) => {
    if (!value.trim()) return null;
    switch (field) {
      case 'clientName':
        return value.trim().length >= 2;
      case 'clientEmail':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'clientPhone':
        return /^[\+]?[0-9\s\-\(\)]{7,20}$/.test(value.trim());
      default:
        return null;
    }
  };

  const InputWrapper = ({ 
    field, 
    icon: Icon, 
    label, 
    required = true,
    children 
  }: { 
    field: string; 
    icon: React.ElementType; 
    label: string; 
    required?: boolean;
    children: React.ReactNode;
  }) => {
    const value = field === 'clientName' ? clientName : field === 'clientEmail' ? clientEmail : field === 'clientPhone' ? clientPhone : notes;
    const hasError = !!errors[field];
    const isValid = isFieldValid(field, value);
    const isFocused = focusedField === field;

    return (
      <div className="group">
        <label 
          htmlFor={field} 
          className={cn(
            "block text-xs sm:text-sm font-medium mb-2.5 transition-colors duration-300",
            isFocused ? "text-primary" : "text-foreground"
          )}
        >
          {label}
          {required && <span className="text-primary font-normal ml-1">{t.required}</span>}
          {!required && <span className="text-muted-foreground font-normal ml-1">({t.optional})</span>}
        </label>
        <div className="relative">
          {/* Icon container with animated background */}
          <div className={cn(
            "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
            isFocused && "bg-primary/10",
            hasError && "bg-destructive/10",
            isValid === true && "bg-success/10"
          )}>
            <Icon className={cn(
              "w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-300",
              isFocused && "text-primary scale-110",
              hasError && "text-destructive",
              isValid === true && "text-success",
              !isFocused && !hasError && isValid !== true && "text-muted-foreground"
            )} />
          </div>
          
          {children}
          
          {/* Validation indicator */}
          <div className={cn(
            "absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 transition-all duration-300",
            (isValid !== null || hasError) ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )}>
            {hasError ? (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive animate-bounce-subtle" />
            ) : isValid === true ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-success animate-scale-in" />
            ) : null}
          </div>
        </div>
        
        {/* Error message with animation */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          hasError ? "max-h-10 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        )}>
          <p className="text-xs sm:text-sm text-destructive flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0 animate-pulse" />
            {errors[field]}
          </p>
        </div>
      </div>
    );
  };

  const inputBaseClasses = (field: string) => {
    const hasError = !!errors[field];
    return cn(
      "w-full pl-14 sm:pl-16 pr-12 sm:pr-14 py-3.5 sm:py-4 rounded-xl border-2 bg-background/60 text-foreground text-sm sm:text-base",
      "placeholder:text-muted-foreground/40 transition-all duration-300",
      "focus:outline-none focus:bg-background focus:border-primary focus:shadow-inner-glow",
      "hover:border-primary/40 hover:bg-background/80",
      hasError 
        ? "border-destructive/40 bg-destructive/5 focus:border-destructive focus:shadow-[inset_0_2px_20px_hsl(0_84%_60%/0.1)]" 
        : "border-border/60"
    );
  };

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
        <div className="glass-premium rounded-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* Name Field */}
          <InputWrapper field="clientName" icon={User} label={t.fullName}>
            <input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => onUpdate('clientName', e.target.value)}
              onFocus={() => setFocusedField('clientName')}
              onBlur={() => setFocusedField(null)}
              placeholder={t.fullNamePlaceholder}
              className={inputBaseClasses('clientName')}
              autoComplete="name"
            />
          </InputWrapper>

          {/* Email Field */}
          <InputWrapper field="clientEmail" icon={Mail} label={t.emailAddress}>
            <input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => onUpdate('clientEmail', e.target.value)}
              onFocus={() => setFocusedField('clientEmail')}
              onBlur={() => setFocusedField(null)}
              placeholder={t.emailPlaceholder}
              className={inputBaseClasses('clientEmail')}
              autoComplete="email"
            />
          </InputWrapper>

          {/* Phone Field */}
          <InputWrapper field="clientPhone" icon={Phone} label={t.phoneNumber}>
            <input
              id="clientPhone"
              type="tel"
              value={clientPhone}
              onChange={(e) => onUpdate('clientPhone', e.target.value)}
              onFocus={() => setFocusedField('clientPhone')}
              onBlur={() => setFocusedField(null)}
              placeholder={t.phonePlaceholder}
              className={inputBaseClasses('clientPhone')}
              autoComplete="tel"
            />
          </InputWrapper>

          {/* Notes Field */}
          <div className="group">
            <label 
              htmlFor="notes" 
              className={cn(
                "block text-xs sm:text-sm font-medium mb-2.5 transition-colors duration-300",
                focusedField === 'notes' ? "text-primary" : "text-foreground"
              )}
            >
              {t.additionalNotes}
              <span className="text-muted-foreground font-normal ml-1">({t.optional})</span>
            </label>
            <div className="relative">
              <div className={cn(
                "absolute left-3 sm:left-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                focusedField === 'notes' && "bg-primary/10"
              )}>
                <FileText className={cn(
                  "w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-300",
                  focusedField === 'notes' ? "text-primary scale-110" : "text-muted-foreground"
                )} />
              </div>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => onUpdate('notes', e.target.value)}
                onFocus={() => setFocusedField('notes')}
                onBlur={() => setFocusedField(null)}
                placeholder={t.notesPlaceholder}
                rows={3}
                className={cn(
                  "w-full pl-14 sm:pl-16 pr-4 py-3.5 sm:py-4 rounded-xl border-2 bg-background/60 text-foreground text-sm sm:text-base",
                  "placeholder:text-muted-foreground/40 transition-all duration-300 resize-none",
                  "focus:outline-none focus:bg-background focus:border-primary focus:shadow-inner-glow",
                  "hover:border-primary/40 hover:bg-background/80 border-border/60"
                )}
              />
            </div>
          </div>

          {/* Privacy Notice - Enhanced */}
          <div className="pt-5 border-t border-border/30">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                {t.privacyNotice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;