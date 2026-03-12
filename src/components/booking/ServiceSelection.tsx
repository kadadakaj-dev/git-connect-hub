import { Service } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useServices } from '@/hooks/useServices';
import ServiceSkeleton from './ServiceSkeleton';
import { Phone } from 'lucide-react';

interface ServiceSelectionProps {
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

const EXPRESS_SERVICE_ID = '6770d8ae-197f-41bf-b58f-514d6ce34d6c';
const EXPRESS_PHONE = '+421 905 307 198';

const ServiceSelection = ({ selectedService, onSelect }: ServiceSelectionProps) => {
  const { t, language } = useLanguage();
  const { data: services, isLoading, error } = useServices();

  if (isLoading) {
    return <ServiceSkeleton />;
  }

  if (error || !services || services.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground text-sm">
          {language === 'sk' ? 'Služby nie sú momentálne dostupné' : 'Services are not available at the moment'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {services.map((service) => {
        const isSelected = selectedService?.id === service.id;
        const isExpress = service.id === EXPRESS_SERVICE_ID;

        if (isExpress) {
          return (
            <a
              key={service.id}
              href={`tel:${EXPRESS_PHONE.replace(/\s/g, '')}`}
              className={cn(
                "flex items-start gap-3 px-3 py-3 rounded-md border-2 border-primary/30",
                "bg-gradient-to-r from-primary/8 via-primary/5 to-transparent",
                "hover:border-primary/50 hover:from-primary/12 transition-all duration-200",
                "relative overflow-hidden group"
              )}
            >
              {/* Accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-md" />
              
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {service.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  {service.description}
                </p>
                <span className="text-[11px] font-semibold text-primary mt-1 inline-flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5" />
                  {EXPRESS_PHONE}
                </span>
              </div>
              <span className="text-sm font-bold font-data text-primary whitespace-nowrap mt-0.5">
                +15 €
              </span>
            </a>
          );
        }

        return (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={cn(
              "w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "border",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border/40 hover:border-border hover:bg-accent/50"
            )}
          >
            {/* Radio indicator */}
            <div className="mt-1 flex-shrink-0">
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "border-primary"
                  : "border-muted-foreground/30"
              )}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug">
                {service.name}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                {service.description} ({service.duration}{t.min})
              </p>
            </div>

            <span className={cn(
              "text-sm font-bold font-data whitespace-nowrap mt-0.5",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {service.price} €
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ServiceSelection;
