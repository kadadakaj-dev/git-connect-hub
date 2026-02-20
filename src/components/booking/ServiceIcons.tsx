import React from 'react';

interface IconProps {
  className?: string;
}

// Chiro masáž - Hands with healing energy
export const ChiroMassageIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="handGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(199, 89%, 75%)" />
        <stop offset="1" stopColor="hsl(199, 89%, 48%)" />
      </linearGradient>
      <linearGradient id="handShine" x1="16" y1="8" x2="32" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <filter id="handShadow" x="-4" y="-2" width="72" height="72">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="hsl(199, 89%, 48%)" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#handShadow)">
      {/* Palm base */}
      <path d="M20 38c-2-6 0-12 4-16 3-3 7-4 10-3l2 1c2 1 4 3 5 6l3 10c1 3 0 7-2 9l-5 5c-3 3-7 3-10 1l-5-5c-2-2-3-5-2-8z" fill="url(#handGrad)" />
      {/* Fingers */}
      <path d="M28 19c0-3 1-6 3-7 1-1 3 0 3 2l1 8M22 22c-2-2-3-6-2-9 1-2 3-2 4 0l2 7M36 22l2-8c1-3 3-3 4-1 1 3 0 7-2 9M40 28l3-5c1-2 3-1 3 1 0 3-1 6-3 8" stroke="url(#handGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Healing energy dots */}
      <circle cx="30" cy="34" r="2" fill="white" opacity="0.7" />
      <circle cx="36" cy="30" r="1.5" fill="white" opacity="0.5" />
      <circle cx="25" cy="30" r="1.2" fill="white" opacity="0.4" />
      {/* 3D shine overlay */}
      <path d="M22 24c2-6 6-9 10-8 3 1 5 3 6 6l2 8c0 2-1 4-2 5" fill="url(#handShine)" />
    </g>
    {/* Sparkle accents */}
    <circle cx="44" cy="14" r="1.5" fill="hsl(199, 89%, 70%)" opacity="0.8">
      <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="14" cy="18" r="1" fill="hsl(199, 89%, 70%)" opacity="0.6">
      <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

// Naprávanie - Spine/Adjustment
export const AdjustmentIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="spineGrad" x1="24" y1="4" x2="40" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(199, 89%, 78%)" />
        <stop offset="0.5" stopColor="hsl(199, 89%, 58%)" />
        <stop offset="1" stopColor="hsl(210, 70%, 42%)" />
      </linearGradient>
      <linearGradient id="spineShine" x1="28" y1="4" x2="36" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.45" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <filter id="spineShadow" x="-4" y="-2" width="72" height="72">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="hsl(210, 70%, 42%)" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#spineShadow)">
      {/* Vertebrae */}
      {[8, 18, 28, 38, 48].map((y, i) => (
        <g key={i}>
          <rect x={28 - (i === 2 ? 2 : 0)} y={y} width={8 + (i === 2 ? 4 : 0)} height={7} rx="3.5" fill="url(#spineGrad)" />
          <rect x={29 - (i === 2 ? 1 : 0)} y={y + 1} width={4 + (i === 2 ? 2 : 0)} height={3} rx="1.5" fill="url(#spineShine)" />
          {/* Side wings */}
          <path d={`M${28 - (i === 2 ? 2 : 0)} ${y + 3.5}l-${5 + i * 0.5} ${i < 2 ? -1 : 1}`} stroke="url(#spineGrad)" strokeWidth="2" strokeLinecap="round" />
          <path d={`M${36 + (i === 2 ? 2 : 0)} ${y + 3.5}l${5 + i * 0.5} ${i < 2 ? -1 : 1}`} stroke="url(#spineGrad)" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      {/* Connecting line */}
      <line x1="32" y1="15" x2="32" y2="48" stroke="hsl(199, 89%, 65%)" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
    </g>
    {/* Adjustment arrows */}
    <path d="M16 30l-4 2 4 2" stroke="hsl(199, 89%, 70%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
      <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.8s" repeatCount="indefinite" />
    </path>
    <path d="M48 30l4 2-4 2" stroke="hsl(199, 89%, 70%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
      <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
    </path>
  </svg>
);

// Celotelová chiro masáž - Full body figure
export const FullBodyIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="bodyGrad" x1="18" y1="6" x2="46" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(199, 89%, 75%)" />
        <stop offset="0.5" stopColor="hsl(199, 89%, 55%)" />
        <stop offset="1" stopColor="hsl(210, 70%, 40%)" />
      </linearGradient>
      <linearGradient id="bodyShine" x1="26" y1="6" x2="34" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="auraGrad" cx="32" cy="32" r="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(199, 89%, 70%)" stopOpacity="0.15" />
        <stop offset="1" stopColor="hsl(199, 89%, 70%)" stopOpacity="0" />
      </radialGradient>
      <filter id="bodyShadow" x="-4" y="-2" width="72" height="72">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="hsl(199, 89%, 48%)" floodOpacity="0.3" />
      </filter>
    </defs>
    {/* Aura background */}
    <circle cx="32" cy="32" r="28" fill="url(#auraGrad)">
      <animate attributeName="r" values="26;30;26" dur="3s" repeatCount="indefinite" />
    </circle>
    <g filter="url(#bodyShadow)">
      {/* Head */}
      <circle cx="32" cy="12" r="5" fill="url(#bodyGrad)" />
      <circle cx="30" cy="10" r="2.5" fill="url(#bodyShine)" />
      {/* Body/Torso */}
      <path d="M28 17h8l2 16h-12l2-16z" fill="url(#bodyGrad)" />
      <path d="M29 17h5l1 10h-7l1-10z" fill="url(#bodyShine)" />
      {/* Arms */}
      <path d="M28 18l-8 10-4 6" stroke="url(#bodyGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 18l8 10 4 6" stroke="url(#bodyGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Legs */}
      <path d="M28 33l-4 14-2 6" stroke="url(#bodyGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 33l4 14 2 6" stroke="url(#bodyGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    {/* Energy points */}
    {[{cx:32,cy:22,r:1.5},{cx:32,cy:28,r:1.2},{cx:32,cy:34,r:1}].map((p, i) => (
      <circle key={i} {...p} fill="white" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
      </circle>
    ))}
  </svg>
);

// Express termín - Lightning/Clock combo
export const ExpressIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="expressGrad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(40, 95%, 65%)" />
        <stop offset="0.5" stopColor="hsl(30, 90%, 55%)" />
        <stop offset="1" stopColor="hsl(199, 89%, 50%)" />
      </linearGradient>
      <linearGradient id="expressShine" x1="20" y1="8" x2="36" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <filter id="expressShadow" x="-4" y="-2" width="72" height="72">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="hsl(30, 90%, 55%)" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#expressShadow)">
      {/* Clock circle */}
      <circle cx="32" cy="34" r="18" fill="none" stroke="url(#expressGrad)" strokeWidth="3" />
      <circle cx="32" cy="34" r="16" fill="hsl(199, 89%, 60%)" fillOpacity="0.08" />
      {/* Clock face shine */}
      <path d="M22 24a16 16 0 0 1 20 0" fill="url(#expressShine)" />
      {/* Clock hands */}
      <line x1="32" y1="34" x2="32" y2="24" stroke="url(#expressGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="34" x2="40" y2="34" stroke="url(#expressGrad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="34" r="2" fill="url(#expressGrad)" />
      <circle cx="32" cy="34" r="1" fill="white" opacity="0.6" />
      {/* Lightning bolt */}
      <path d="M36 6l-6 14h8l-7 16 2-10h-7l6-14h-2z" fill="url(#expressGrad)" />
      <path d="M34 8l-4 10h5l-3 8" fill="url(#expressShine)" />
    </g>
    {/* Speed lines */}
    <line x1="50" y1="28" x2="56" y2="26" stroke="hsl(40, 95%, 65%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
      <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.5s" repeatCount="indefinite" />
    </line>
    <line x1="52" y1="34" x2="58" y2="34" stroke="hsl(40, 95%, 65%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
    </line>
    <line x1="50" y1="40" x2="56" y2="42" stroke="hsl(40, 95%, 65%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" begin="1s" repeatCount="indefinite" />
    </line>
  </svg>
);

// Map from DB icon strings to components
export const serviceIconMap: Record<string, React.FC<IconProps>> = {
  Hand: ChiroMassageIcon,
  Bone: AdjustmentIcon,
  Activity: FullBodyIcon,
  ClipboardCheck: ExpressIcon,
};
