import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "surface-card p-4 md:p-5 relative",
    className
  )}>
    <div className="relative z-[2]">{children}</div>
  </div>
);

export default GlassCard;
