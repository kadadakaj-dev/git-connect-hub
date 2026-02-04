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
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary/20 animate-ping" />
            </div>
            <p className="text-muted-foreground text-sm">Načítavam služby...</p>
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
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          {t.chooseServiceSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger-children">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Activity;
          const isSelected = selectedService?.id === service.id;

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "relative p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 group",
                "glass-card hover:shadow-lg active:scale-[0.98]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected && "ring-2 ring-primary shadow-glow"
              )}
            >
              {/* Category Badge */}
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full mb-3 uppercase tracking-wide transition-colors duration-200",
                service.category === 'physiotherapy' 
                  ? "bg-primary/15 text-primary" 
                  : "bg-accent text-accent-foreground"
              )}>
                {service.category === 'physiotherapy' ? t.categories.physiotherapy : t.categories.chiropractic}
              </span>

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted/60 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary group-hover:scale-105"
              )}>
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 group-hover:scale-110" />
              </div>

              {/* Service Info */}
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 font-sans leading-tight">
                {service.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                {service.description}
              </p>

              {/* Duration & Price */}
              <div className="flex items-center justify-between text-xs sm:text-sm pt-3 sm:pt-4 border-t border-border/40">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {service.duration} {t.min}
                </span>
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {service.price}€
                </span>
              </div>

              {/* Selection Indicator & Arrow */}
              <div className={cn(
                "absolute top-4 right-4 transition-all duration-300",
                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-60 group-hover:scale-100"
              )}>
                {isSelected ? (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center shadow-md animate-scale-in">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
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
