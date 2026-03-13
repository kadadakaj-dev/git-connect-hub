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
    <div className="space-y-1.5">
      {services.map((service) => {
        const isSelected = selectedService?.id === service.id;
        const isExpress = service.id === EXPRESS_SERVICE_ID;

        if (isExpress) {
          return (
            <a
              key={service.id}
              href={`tel:${EXPRESS_PHONE.replace(/\s/g, '')}`}
              className={cn(
                "flex items-start gap-3 px-3 py-3 rounded-xl border-2 border-primary/30",
                "backdrop-blur-sm bg-primary/5",
                "hover:border-primary/50 hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-glass",
                "transition-all duration-300 ease-liquid",
                "relative overflow-hidden group"
              )}
            >
              {/* Accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
              
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
              "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left",
              "transition-all duration-300 ease-liquid",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "border backdrop-blur-sm",
              isSelected
                ? "border-primary bg-primary/8 shadow-[0_0_16px_rgba(59,130,246,0.12)] -translate-y-0.5"
                : "border-[var(--glass-border-subtle)] bg-[var(--glass-white)] hover:border-[var(--glass-border)] hover:bg-[var(--glass-white-md)] hover:-translate-y-0.5 hover:shadow-glass"
            )}
          >
            {/* Radio indicator */}
            <div className="mt-1 flex-shrink-0">
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-liquid",
                isSelected
                  ? "border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  : "border-muted-foreground/30"
              )}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-scale-in" />
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
              "text-sm font-bold font-data whitespace-nowrap mt-0.5 transition-colors duration-200",
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
