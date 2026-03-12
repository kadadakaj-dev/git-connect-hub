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
            <div
              key={service.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-md border border-border/40 bg-muted/30 opacity-70"
            >
              <div className="mt-0.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {service.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  {service.description}
                </p>
                <a
                  href={`tel:${EXPRESS_PHONE.replace(/\s/g, '')}`}
                  className="text-[11px] font-medium text-primary hover:underline mt-0.5 inline-block"
                >
                  {language === 'sk' ? 'Len telefonicky' : 'Phone only'}: {EXPRESS_PHONE}
                </a>
              </div>
              <span className="text-sm font-bold font-data text-muted-foreground whitespace-nowrap mt-0.5">
                +15 €
              </span>
            </div>
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
