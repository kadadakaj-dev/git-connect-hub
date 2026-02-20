import { Service } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useServices } from '@/hooks/useServices';
import ServiceSkeleton from './ServiceSkeleton';
import { serviceIconMap } from './ServiceIcons';
import { 
  Clock,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react';

interface ServiceSelectionProps {
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

const ServiceSelection = ({ selectedService, onSelect }: ServiceSelectionProps) => {
  const { t, language } = useLanguage();
  const { data: services, isLoading, error } = useServices();

  if (isLoading) {
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
        <ServiceSkeleton />
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
          <div className="glass-premium rounded-2xl p-8 max-w-md mx-auto">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 stagger-children">
        {services.map((service, index) => {
          const ServiceIcon = serviceIconMap[service.icon];
          const isSelected = selectedService?.id === service.id;
          const isPopular = index === 0; // First service as popular

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "relative p-5 sm:p-6 rounded-2xl text-left group",
                "glass-card interactive-card",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected && "ring-2 ring-primary shadow-glow bg-gradient-to-br from-primary/5 to-accent/10"
              )}
            >
              {/* Popular badge */}
              {isPopular && !isSelected && (
                <div className="absolute -top-2.5 -right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-semibold shadow-md animate-bounce-subtle">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>{language === 'sk' ? 'Obľúbené' : 'Popular'}</span>
                </div>
              )}

              {/* Category Badge */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-full mb-4 uppercase tracking-wider transition-all duration-300",
                service.category === 'physiotherapy' 
                  ? "bg-primary/12 text-primary group-hover:bg-primary/20" 
                  : "bg-accent text-accent-foreground group-hover:bg-accent/80"
              )}>
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {service.category === 'physiotherapy' ? t.categories.physiotherapy : t.categories.chiropractic}
              </span>

              {/* Icon with enhanced styling */}
              <div className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-400",
                "relative overflow-hidden",
                isSelected 
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30" 
                  : "bg-gradient-to-br from-muted/80 to-muted/40 text-muted-foreground group-hover:from-primary/20 group-hover:to-primary/10 group-hover:text-primary"
              )}>
                {/* Icon glow effect */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300",
                  "group-hover:opacity-100"
                )} />
                {ServiceIcon ? (
                  <ServiceIcon className={cn(
                    "w-full h-full transition-all duration-400 relative z-10",
                    "group-hover:scale-110"
                  )} />
                ) : (
                  <Zap className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 transition-all duration-400 relative z-10",
                    "group-hover:scale-110 group-hover:rotate-3"
                  )} />
                )}
              </div>

              {/* Service Info */}
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 font-sans leading-tight group-hover:text-primary transition-colors duration-300">
                {service.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                {service.description}
              </p>

              {/* Duration & Price - Enhanced */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/50">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{service.duration} {t.min}</span>
                </span>
                <span className={cn(
                  "font-bold text-lg sm:text-xl transition-all duration-300",
                  isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                )}>
                  {service.price}€
                </span>
              </div>

              {/* Selection Indicator & Arrow */}
              <div className={cn(
                "absolute top-5 right-5 transition-all duration-400",
                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-70 group-hover:scale-100"
              )}>
                {isSelected ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 animate-scale-in">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </div>

              {/* Bottom highlight line */}
              <div className={cn(
                "absolute bottom-0 left-4 right-4 h-0.5 rounded-full transition-all duration-500",
                "bg-gradient-to-r from-transparent via-primary to-transparent",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;