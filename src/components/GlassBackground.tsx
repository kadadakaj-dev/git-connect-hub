const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-100 md:opacity-100">
    <div
      className="glass-blob max-md:!opacity-[0.15]"
      style={{
        width: 760,
        height: 760,
        background: 'radial-gradient(circle, rgba(191, 226, 255, 0.96) 0%, rgba(126, 195, 255, 0.48) 48%, rgba(126, 195, 255, 0) 78%)',
        top: -240,
        left: -170,
        ['--blob-dur' as string]: '24s',
      }}
    />
    <div
      className="glass-blob max-md:!opacity-[0.12]"
      style={{
        width: 660,
        height: 660,
        background: 'radial-gradient(circle, rgba(234, 246, 255, 0.96) 0%, rgba(216, 238, 255, 0.76) 46%, rgba(216, 238, 255, 0) 78%)',
        bottom: -250,
        right: -120,
        ['--blob-dur' as string]: '18s',
        animationDelay: '-8s',
      }}
    />
    <div
      className="glass-blob max-md:!opacity-[0.1]"
      style={{
        width: 430,
        height: 430,
        background: 'radial-gradient(circle, rgba(36, 71, 107, 0.14) 0%, rgba(126, 195, 255, 0.18) 42%, rgba(126, 195, 255, 0) 74%)',
        top: '36%',
        left: '54%',
        ['--blob-dur' as string]: '27s',
        animationDelay: '-13s',
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0) 100%)',
      }}
    />
  </div>
);

export default GlassBackground;
