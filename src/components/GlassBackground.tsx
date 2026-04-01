const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-100 select-none">
    {/* Primary Aurora Blob */}
    <div
      className="glass-blob !opacity-[0.34] max-md:!opacity-[0.22]"
      style={{
        width: 900,
        height: 900,
        background: 'radial-gradient(circle at center, rgba(162, 219, 255, 0.82) 0%, rgba(126, 195, 255, 0.36) 45%, rgba(126, 195, 255, 0) 75%)',
        top: -300,
        left: -200,
        ['--blob-dur' as string]: '30s',
      }}
    />
    {/* Secondary Soft Mist Blob */}
    <div
      className="glass-blob !opacity-[0.28] max-md:!opacity-[0.18]"
      style={{
        width: 800,
        height: 800,
        background: 'radial-gradient(circle at center, rgba(234, 246, 255, 0.88) 0%, rgba(216, 238, 255, 0.44) 48%, rgba(216, 238, 255, 0) 78%)',
        bottom: -300,
        right: -150,
        ['--blob-dur' as string]: '22s',
        animationDelay: '-5s',
      }}
    />
    {/* Tertiary Deep Accent Blob */}
    <div
      className="glass-blob !opacity-[0.14] max-md:!opacity-[0.08]"
      style={{
        width: 600,
        height: 600,
        background: 'radial-gradient(circle at center, rgba(36, 71, 107, 0.12) 0%, rgba(137, 207, 240, 0.22) 50%, rgba(137, 207, 240, 0) 80%)',
        top: '28%',
        left: '48%',
        ['--blob-dur' as string]: '35s',
        animationDelay: '-12s',
      }}
    />
    {/* Surface Frosting Overlay */}
    <div
      className="absolute inset-0 backdrop-blur-[1px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 34%, rgba(255,255,255,0) 100%)',
      }}
    />
  </div>
);

export default GlassBackground;
