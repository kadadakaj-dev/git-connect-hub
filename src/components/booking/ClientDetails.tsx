import { useState } from 'react';
import { User, Mail, Phone, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Your Details
        </h2>
        <p className="text-muted-foreground">
          Please provide your contact information
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-elegant space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="name"
                type="text"
                value={clientName}
                onChange={(e) => onUpdate('clientName', e.target.value)}
                placeholder="John Doe"
                className={cn(
                  "w-full pl-11 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  errors.clientName ? "border-destructive" : "border-input"
                )}
              />
            </div>
            {errors.clientName && (
              <p className="text-sm text-destructive mt-1">{errors.clientName}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={clientEmail}
                onChange={(e) => onUpdate('clientEmail', e.target.value)}
                placeholder="john@example.com"
                className={cn(
                  "w-full pl-11 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  errors.clientEmail ? "border-destructive" : "border-input"
                )}
              />
            </div>
            {errors.clientEmail && (
              <p className="text-sm text-destructive mt-1">{errors.clientEmail}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => onUpdate('clientPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={cn(
                  "w-full pl-11 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  errors.clientPhone ? "border-destructive" : "border-input"
                )}
              />
            </div>
            {errors.clientPhone && (
              <p className="text-sm text-destructive mt-1">{errors.clientPhone}</p>
            )}
          </div>

          {/* Notes Field */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
              Additional Notes
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => onUpdate('notes', e.target.value)}
                placeholder="Any specific concerns or information we should know..."
                rows={4}
                className={cn(
                  "w-full pl-11 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary border-input"
                )}
              />
            </div>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our privacy policy. We'll only use your information to manage your appointment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
