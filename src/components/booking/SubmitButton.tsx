import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  enabled: boolean;
  isPending: boolean;
  onSubmit: () => void;
}

const SubmitButton = ({ enabled, isPending, onSubmit }: SubmitButtonProps) => {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0.3, y: 12 }}
      animate={{
        opacity: enabled ? 1 : 0.3,
        y: enabled ? 0 : 12,
        scale: enabled ? 1 : 0.98,
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("pb-6", !enabled && "pointer-events-none")}
    >
      <Button
        variant="default"
        size="lg"
        onClick={onSubmit}
        disabled={!enabled || isPending}
        className="w-full gap-2 rounded-[20px] text-sm font-semibold h-12 border border-[rgba(255,255,255,0.24)] bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] hover:brightness-[1.03] text-primary-foreground shadow-[0_16px_40px_rgba(79,149,213,0.28)] hover:-translate-y-0.5 transition-all duration-300 ease-liquid active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{language === 'sk' ? 'Rezervujem...' : 'Booking...'}</span>
          </>
        ) : (
          <span>{language === 'sk' ? 'Rezervovať' : 'Book now'}</span>
        )}
      </Button>
    </motion.div>
  );
};

export default SubmitButton;
