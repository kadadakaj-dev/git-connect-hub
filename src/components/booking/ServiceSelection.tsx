import { Service } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useServices } from '@/hooks/useServices';
import { 
  ClipboardCheck, 
  Activity, 
  Bone, 
  Dumbbell, 
  Hand, 
  MessageSquare,
  Clock,
  Loader2,
  ChevronRight
} from 'lucide-react';

interface ServiceSelectionProps {
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

const iconMap: Record<string, React.ElementType> = {
  ClipboardCheck,
  Activity,
  Bone,
  Dumbbell,
  Hand,
  MessageSquare,
};

const ServiceSelection = ({ selectedService, onSelect }: ServiceSelectionProps) => {
  const { t, language } = useLanguage();
  const { data: services, isLoading, error } = useServices();

  if (isLoading) {
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
            {t.selectService}
          </h2>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Načítavam služby...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !services || services.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
            {t.selectService}
          </h2>
        </div>
        <div className="text-center py-20">
          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto">
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
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
          {t.selectService}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t.chooseServiceSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 stagger-children">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Activity;
          const isSelected = selectedService?.id === service.id;

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "relative p-5 sm:p-6 rounded-2xl text-left transition-all duration-300 group",
                "glass-card hover:shadow-xl",
                isSelected && "ring-2 ring-primary shadow-glow"
              )}
            >
              {/* Category Badge */}
              <span className={cn(
                "inline-block px-3 py-1 text-xs font-medium rounded-full mb-4",
                service.category === 'physiotherapy' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-accent text-accent-foreground"
              )}>
                {service.category === 'physiotherapy' ? t.categories.physiotherapy : t.categories.chiropractic}
              </span>

              {/* Icon */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="w-7 h-7" />
              </div>

              {/* Service Info */}
              <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
                {service.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                {service.description}
              </p>

              {/* Duration & Price */}
              <div className="flex items-center justify-between text-sm pt-4 border-t border-border/50">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {service.duration} {t.min}
                </span>
                <span className="font-bold text-foreground text-base">
                  {service.price}€
                </span>
              </div>

              {/* Selection Indicator & Arrow */}
              <div className={cn(
                "absolute top-5 right-5 transition-all duration-300",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
              )}>
                {isSelected ? (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;
