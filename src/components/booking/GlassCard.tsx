import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "lg-glass-card p-4 sm:p-5 md:p-6 relative",
    className
  )}>
    <div className="relative z-[2]">{children}</div>
  </div>
);

export default GlassCard;
