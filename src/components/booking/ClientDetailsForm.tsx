import { useState } from 'react';
import { User, Phone, Mail, FileText, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { BookingData } from '@/types/booking';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface ClientDetailsFormProps {
  bookingData: BookingData;
  errors: Record<string, string>;
  onUpdate: (field: string, value: string) => void;
}

const isFieldValid = (field: string, value: string) => {
  if (!value.trim()) return null;
  switch (field) {
    case 'clientName': return value.trim().length >= 2;
    case 'clientEmail': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'clientPhone': return /^[\+]?[0-9\s\-\(\)]{7,20}$/.test(value.trim());
    default: return null;
  }
};

const inputClasses = (field: string, errors: Record<string, string>) => {
  const hasError = !!errors[field];
  return cn(
    "w-full pl-8 pr-8 py-2.5 rounded-xl border text-foreground text-sm",
    "bg-[var(--glass-white)] backdrop-blur-sm",
    "placeholder:text-muted-foreground/50 transition-all duration-300 ease-liquid",
    "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-[var(--glass-white-md)]",
    hasError
      ? "border-destructive/50 bg-destructive/5"
      : "border-[var(--glass-border-subtle)] hover:border-[var(--glass-border)]"
  );
};

const FormField = ({
  field,
  icon: Icon,
  placeholder,
  type,
  value,
  errors,
  autoComplete,
  focusedField,
  onUpdate,
  onFocus,
  onBlur,
}: {
  field: string;
  icon: React.ElementType;
  placeholder: string;
  type: string;
  value: string;
  errors: Record<string, string>;
  autoComplete?: string;
  focusedField: string | null;
  onUpdate: (field: string, value: string) => void;
  onFocus: (field: string) => void;
  onBlur: () => void;
}) => {
  const hasError = !!errors[field];
  const isValid = isFieldValid(field, value);
  const isFocused = focusedField === field;

  return (
    <div>
      <div className="relative">
        <Icon className={cn(
          "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200",
          isFocused ? "text-primary" : hasError ? "text-destructive" : "text-muted-foreground"
        )} />
        <input
          id={field}
          type={type}
          value={value}
          onChange={(e) => onUpdate(field, e.target.value)}
          onFocus={() => onFocus(field)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={inputClasses(field, errors)}
          autoComplete={autoComplete}
        />
        <div className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 transition-all duration-200",
          (isValid !== null || hasError) ? "opacity-100" : "opacity-0"
        )}>
          {hasError ? (
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          ) : isValid === true ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          ) : null}
        </div>
      </div>
      {hasError && (
        <p className="text-[11px] text-destructive mt-0.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-destructive" />
          {errors[field]}
        </p>
      )}
    </div>
  );
};

const ClientDetailsForm = ({ bookingData, errors, onUpdate }: ClientDetailsFormProps) => {
  const { t, language } = useLanguage();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <FormField field="clientName" icon={User} placeholder={t.fullNamePlaceholder} type="text" value={bookingData.clientName} errors={errors} autoComplete="name" focusedField={focusedField} onUpdate={onUpdate} onFocus={setFocusedField} onBlur={() => setFocusedField(null)} />
      <FormField field="clientEmail" icon={Mail} placeholder={t.emailPlaceholder} type="email" value={bookingData.clientEmail} errors={errors} autoComplete="email" focusedField={focusedField} onUpdate={onUpdate} onFocus={setFocusedField} onBlur={() => setFocusedField(null)} />
      <FormField field="clientPhone" icon={Phone} placeholder={t.phonePlaceholder} type="tel" value={bookingData.clientPhone} errors={errors} autoComplete="tel" focusedField={focusedField} onUpdate={onUpdate} onFocus={setFocusedField} onBlur={() => setFocusedField(null)} />

      <div className="relative">
        <FileText className={cn(
          "absolute left-2.5 top-2.5 w-3.5 h-3.5 transition-colors duration-200",
          focusedField === 'notes' ? "text-primary" : "text-muted-foreground"
        )} />
        <textarea
          id="notes"
          value={bookingData.notes}
          onChange={(e) => onUpdate('notes', e.target.value)}
          onFocus={() => setFocusedField('notes')}
          onBlur={() => setFocusedField(null)}
          placeholder={t.notesPlaceholder}
          rows={2}
          className={cn(
            "w-full pl-8 pr-3 py-2.5 rounded-xl border text-foreground text-sm resize-none",
            "bg-[var(--glass-white)] backdrop-blur-sm",
            "placeholder:text-muted-foreground/50 transition-all duration-300 ease-liquid",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-[var(--glass-white-md)]",
            "border-[var(--glass-border-subtle)] hover:border-[var(--glass-border)]"
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Shield className="w-3 h-3 text-primary flex-shrink-0" />
        <p className="text-[10px] text-foreground/60">
          {language === 'sk' ? 'GDPR • Vaše údaje sú chránené' : 'GDPR • Your data is protected'}
        </p>
      </div>
    </div>
  );
};

export default ClientDetailsForm;
