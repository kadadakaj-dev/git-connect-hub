import { Check } from 'lucide-react';
import { BookingStep } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProgressBarProps {
  steps: BookingStep[];
  currentStep: number;
}

const ProgressBar = ({ steps, currentStep }: ProgressBarProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden sm:block">
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle & Label */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500",
                        isCompleted && "bg-primary text-primary-foreground shadow-md",
                        isCurrent && "bg-navy text-navy-foreground shadow-lg ring-4 ring-navy/20 animate-pulse-ring",
                        !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={cn(
                        "text-sm font-medium transition-colors",
                        (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4 md:mx-6">
                      <div className="relative h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700 ease-out",
                            isCompleted ? "w-full" : "w-0"
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Mobile Progress */}
      <div className="sm:hidden">
        <div className="glass-card rounded-2xl p-4">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "w-8 bg-navy" 
                    : index < currentStep 
                      ? "w-2 bg-primary" 
                      : "w-2 bg-muted"
                )}
              />
            ))}
          </div>
          
          {/* Current step info */}
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              {steps[currentStep]?.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.stepOf.replace('{current}', String(currentStep + 1)).replace('{total}', String(steps.length))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
