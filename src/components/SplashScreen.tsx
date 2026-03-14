import React, { useState, useEffect, useCallback } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);
  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
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
      style={{ backgroundColor: 'hsl(215, 25%, 10%)' }}
    >
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h1 className="text-4xl font-heading font-semibold text-white tracking-[0.2em] drop-shadow-lg">
          FYZIO&FIT
        </h1>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: 'hsl(210, 70%, 55%)',
              animation: 'splash-progress 0.8s ease-in-out forwards',
            }}
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splash-progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
