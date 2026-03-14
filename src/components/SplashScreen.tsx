import React, { useState, useEffect, useCallback } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const splashStyles: React.CSSProperties = {
  backgroundColor: '#BFE2FF',
};

const progressBarBgStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.15)',
};

const progressBarStyle: React.CSSProperties = {
  backgroundColor: 'hsl(210, 70%, 55%)',
  width: '0%',
  transition: 'width 0.8s ease-in-out',
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
    // Trigger progress animation on next frame
    requestAnimationFrame(() => setAnimate(true));

    const fadeTimer = setTimeout(() => setIsFading(true), 400);
    const completeTimer = setTimeout(() => stableOnComplete(), 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [stableOnComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-400 ease-in-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={splashStyles}
    >
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h1 className="text-4xl font-heading font-semibold text-white tracking-[0.2em] drop-shadow-lg">
          FYZIO&FIT
        </h1>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={progressBarBgStyle}>
          <div
            className="h-full rounded-full"
            style={{
              ...progressBarStyle,
              width: animate ? '100%' : '0%',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
