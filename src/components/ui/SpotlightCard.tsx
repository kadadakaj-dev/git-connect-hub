import { useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'button';
  onClick?: () => void;
  disabled?: boolean;
}

const SpotlightCard = ({ children, className, as: Component = 'div', onClick, disabled }: SpotlightCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const spotlightStyle = isHovering ? {
    '--mouse-x': `${position.x}px`,
    '--mouse-y': `${position.y}px`,
  } as React.CSSProperties : {};

  return (
    <Component
      ref={ref as any}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      disabled={Component === 'button' ? disabled : undefined}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={spotlightStyle}
    >
      {/* Spotlight overlay */}
      {isHovering && (
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), hsl(0 0% 100% / 0.06), transparent 40%)`,
          }}
        />
      )}
      {children}
    </Component>
  );
};

export default SpotlightCard;
