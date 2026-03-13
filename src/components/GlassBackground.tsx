const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div
      className="glass-blob"
      style={{
        width: 700,
        height: 700,
        background: 'radial-gradient(circle, #5ee7df, #3b82f6)',
        top: -200,
        left: -150,
        ['--blob-dur' as string]: '22s',
      }}
    />
    <div
      className="glass-blob"
      style={{
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, #b490f5, #ec4899)',
        bottom: -200,
        right: -100,
        ['--blob-dur' as string]: '17s',
        animationDelay: '-8s',
      }}
    />
    <div
      className="glass-blob"
      style={{
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, #ffd27f, #f7a8c4)',
        top: '40%',
        left: '50%',
        ['--blob-dur' as string]: '25s',
        animationDelay: '-13s',
      }}
    />
  </div>
);

export default GlassBackground;
