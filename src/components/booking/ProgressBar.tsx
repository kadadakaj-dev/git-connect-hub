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
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* Step Circle & Label */}
                  <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
                    <div
                      className={cn(
                        "w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-400 relative",
                        isCompleted && "bg-primary text-primary-foreground shadow-md",
                        isCurrent && "bg-navy text-navy-foreground shadow-lg ring-4 ring-navy/20",
                        !isCompleted && !isCurrent && "bg-muted/80 text-muted-foreground border-2 border-border/50"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                      ) : (
                        <svg 
                          viewBox="0 0 24 24" 
                          className="w-5 h-5 md:w-6 md:h-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {index === 0 && (
                            // Number 1 - elegant single stroke
                            <path d="M9 7l3-2v14M9 19h6" />
                          )}
                          {index === 1 && (
                            // Number 2 - curved elegant style
                            <path d="M7 8a4 4 0 0 1 7.5-2c1 1.5.5 3-1 4.5L7 17h10" />
                          )}
                          {index === 2 && (
                            // Number 3 - two curves
                            <path d="M7 7h6l-3 5c2.5 0 4 1.5 4 3.5s-1.5 3.5-4 3.5c-2 0-3.5-1-4-2.5" />
                          )}
                          {index === 3 && (
                            // Number 4 - angular design
                            <path d="M14 5v14M7 13h10M7 13V5l7 8" />
                          )}
                        </svg>
                      )}
                    </div>
                    <div className="mt-2.5 text-center">
                      <p className={cn(
                        "text-xs md:text-sm font-semibold transition-colors duration-200",
                        isCompleted && "text-primary",
                        isCurrent && "text-foreground",
                        !isCompleted && !isCurrent && "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="w-12 md:w-20 mx-2 md:mx-4">
                      <div className="relative h-0.5 rounded-full bg-border/60 overflow-hidden">
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-600 ease-out",
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
        <div className="glass-card rounded-xl p-4">
          {/* Progress steps with SVG numbers */}
          <div className="flex items-center justify-center gap-3">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                      isCompleted && "bg-primary text-primary-foreground shadow-sm",
                      isCurrent && "bg-navy text-navy-foreground shadow-md ring-2 ring-navy/20",
                      !isCompleted && !isCurrent && "bg-muted/70 text-muted-foreground border border-border/50"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                      <svg 
                        viewBox="0 0 24 24" 
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {index === 0 && <path d="M9 7l3-2v14M9 19h6" />}
                        {index === 1 && <path d="M7 8a4 4 0 0 1 7.5-2c1 1.5.5 3-1 4.5L7 17h10" />}
                        {index === 2 && <path d="M7 7h6l-3 5c2.5 0 4 1.5 4 3.5s-1.5 3.5-4 3.5c-2 0-3.5-1-4-2.5" />}
                        {index === 3 && <path d="M14 5v14M7 13h10M7 13V5l7 8" />}
                      </svg>
                    )}
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="w-6 mx-1.5">
                      <div className="relative h-0.5 rounded-full bg-border/50 overflow-hidden">
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out",
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
          
          {/* Current step info */}
          <div className="text-center mt-3">
            <p className="text-sm font-semibold text-foreground">
              {steps[currentStep]?.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t.stepOf.replace('{current}', String(currentStep + 1)).replace('{total}', String(steps.length))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
