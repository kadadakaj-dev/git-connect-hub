const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
    {/* Animated Background Blobs — Styled with Official Tokens */}
    <div className="absolute inset-0 z-0">
      <div 
        className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] rounded-full bg-lg-color-brand-blue/15 blur-lg-blur-blob animate-pulse"
        style={{ 
          filter: 'blur(var(--lg-blur-blob))',
          animationDuration: 'var(--lg-duration-blob-base)',
          opacity: 'var(--lg-effect-blob-opacity)'
        }}
      />
      <div 
        className="absolute bottom-[0%] right-[-5%] w-[55vw] h-[55vw] rounded-full bg-lg-color-brand-sky/20 blur-lg-blur-blob animate-pulse"
        style={{ 
          filter: 'blur(var(--lg-blur-blob))',
          animationDuration: 'var(--lg-duration-blob-slow)',
          animationDelay: '2s',
          opacity: 'var(--lg-effect-blob-opacity)'
        }}
      />
      <div 
        className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full bg-lg-color-brand-blue-light/10 blur-lg-blur-blob animate-pulse"
        style={{ 
          filter: 'blur(var(--lg-blur-blob))',
          animationDuration: 'var(--lg-duration-blob-long)',
          animationDelay: '5s',
          opacity: 'var(--lg-effect-blob-opacity)'
        }}
      />
    </div>

    {/* Subtle Surface Polish */}
    <div
      className="absolute inset-0 backdrop-blur-[1px]"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
      }}
    />
  </div>
);

export default GlassBackground;
