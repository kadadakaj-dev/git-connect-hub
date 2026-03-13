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
                "block rounded-2xl relative overflow-hidden",
                "backdrop-blur-xl bg-[var(--glass-white)] border border-[var(--glass-border)] shadow-glass",
                "before:absolute before:inset-0 before:bg-[var(--reflection-top)] before:pointer-events-none before:rounded-[inherit] before:z-[1]",
                "hover:-translate-y-1 hover:shadow-glass-float",
                "transition-all duration-300 ease-liquid",
                "group cursor-pointer"
              )}
            >
              {/* Baby blue gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400/[0.08] to-blue-400/[0.05] pointer-events-none rounded-[inherit]" />

              <div className="relative z-[2] p-4">
                {/* Top row: badge + price */}
                <div className="flex items-start justify-between mb-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-400/15 text-sky-600 dark:text-sky-400 border border-sky-400/20">
                    ⚡ {t.expressLabel}
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-bold font-data text-sky-600 dark:text-sky-400 leading-none">
                      +15 €
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t.expressSurcharge}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                  {t.expressDesc}
                </p>

                {/* CTA button */}
                <div className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                  "backdrop-blur-xl bg-[var(--glass-white-md)] border border-sky-400/20",
                  "group-hover:bg-sky-400/10 group-hover:border-sky-400/30",
                  "transition-all duration-300"
                )}>
                  <Phone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-sm font-semibold text-foreground">{t.expressCta}</span>
                  <span className="text-sm font-bold font-data text-sky-600 dark:text-sky-400">{EXPRESS_PHONE}</span>
                </div>
              </div>
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
