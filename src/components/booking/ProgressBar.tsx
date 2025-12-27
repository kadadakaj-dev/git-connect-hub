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
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground shadow-glow ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center hidden sm:block">
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
                <div className="flex-1 mx-3 hidden sm:block">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all duration-500",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mobile step indicator */}
      <div className="sm:hidden mt-4 text-center">
        <p className="text-sm font-medium text-foreground">
          {steps[currentStep]?.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t.stepOf.replace('{current}', String(currentStep + 1)).replace('{total}', String(steps.length))}
        </p>
      </div>
    </div>
  );
};

export default ProgressBar;
