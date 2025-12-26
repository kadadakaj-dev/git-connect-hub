import { Service } from '@/types/booking';
import { services } from '@/data/services';
import { cn } from '@/lib/utils';
import { 
  ClipboardCheck, 
  Activity, 
  Bone, 
  Dumbbell, 
  Hand, 
  MessageSquare,
  Clock,
  DollarSign
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
  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Select Your Service
        </h2>
        <p className="text-muted-foreground">
          Choose the treatment that best fits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Activity;
          const isSelected = selectedService?.id === service.id;

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "relative p-6 rounded-xl text-left transition-all duration-300 group",
                "border-2 hover:shadow-elegant",
                isSelected
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {/* Category Badge */}
              <span className={cn(
                "inline-block px-2 py-1 text-xs font-medium rounded-full mb-3",
                service.category === 'physiotherapy' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-accent text-accent-foreground"
              )}>
                {service.category === 'physiotherapy' ? 'Physiotherapy' : 'Chiropractic'}
              </span>

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Service Info */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {service.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {service.description}
              </p>

              {/* Duration & Price */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {service.duration} min
                </span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <DollarSign className="w-4 h-4" />
                  {service.price}
                </span>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
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
