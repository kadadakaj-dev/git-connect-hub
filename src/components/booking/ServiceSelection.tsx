import { Service } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useServices } from '@/hooks/useServices';
import ServiceSkeleton from './ServiceSkeleton';
import { Clock, Check, Phone } from 'lucide-react';

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
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {t.selectService}
          </h2>
          <p className="text-muted-foreground text-sm">{t.chooseServiceSubtitle}</p>
        </div>
        <ServiceSkeleton />
      </div>
    );
  }

  if (error || !services || services.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t.selectService}</h2>
        </div>
        <div className="text-center py-16">
          <div className="bg-card border border-border/60 rounded-lg p-8 max-w-md mx-auto shadow-soft">
            <p className="text-muted-foreground">
              {language === 'sk' ? 'Služby nie sú momentálne dostupné' : 'Services are not available at the moment'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {t.selectService}
        </h2>
        <p className="text-muted-foreground text-sm">{t.chooseServiceSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "p-5 rounded-lg text-left transition-all duration-200 relative",
                "bg-card border shadow-soft",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:shadow-elevated hover:-translate-y-px",
                isSelected
                  ? "border-l-[3px] border-l-primary border-t-border/60 border-r-border/60 border-b-border/60 bg-primary/5"
                  : "border-border/60"
              )}
            >
              {/* Title */}
              <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-tight">
                {service.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                {service.description}
              </p>

              {/* Duration & Price */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{service.duration} {t.min}</span>
                </span>
                <span className={cn(
                  "text-sm font-bold font-data px-3 py-1 rounded-md",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-foreground"
                )}>
                  {service.price}€
                </span>
              </div>

              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;
