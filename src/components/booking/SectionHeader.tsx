import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SectionHeader = ({
  number,
  title,
  completed,
}: {
  number: number;
  title: string;
  completed: boolean;
}) => (
  <div className="flex items-center gap-3">
    <motion.div
      animate={completed ? { scale: [1, 1.12, 1] } : {}}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 shadow-[0_8px_20px_rgba(126,195,255,0.12)]",
        completed
          ? "bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white border border-white/50"
          : "bg-white/72 text-[hsl(var(--navy))] border border-[rgba(64,114,163,0.16)] backdrop-blur-md"
      )}
    >
      <AnimatePresence mode="wait">
        {completed ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span
            key="number"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {number}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
    <span className="text-sm font-semibold tracking-tight text-[hsl(var(--soft-navy))]">{title}</span>
  </div>
);

export default SectionHeader;
