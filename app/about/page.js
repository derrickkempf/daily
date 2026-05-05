export const metadata = {
  title: 'About — The Work',
  description: 'What this is, and why it exists.',
}

const PLATFORMS = [
  { name: 'Instagram',   status: 'live', note: 'IG_ACCESS_TOKEN + IG_USER_ID' },
  { name: 'X (Twitter)', status: 'live', note: 'X_ACCESS_TOKEN + X_API_KEY' },
  { name: 'LinkedIn',    status: 'live', note: 'LINKEDIN_ACCESS_TOKEN' },
  { name: 'Pinterest',   status: 'live', note: 'PINTEREST_ACCESS_TOKEN + PINTEREST_BOARD_ID' },
  { name: 'YouTube',     status: 'soon', note: 'Coming soon — video posts' },
  { name: 'TikTok',      status: 'soon', note: 'Coming soon — video posts' },
]

export default function AboutPage() {
  return (
    <main className="pd-container about-page">
      <p className="about-eyebrow">What is this</p>
      <h1 className="about-headline">
        A living record of creative evolution.
      </h1>

      <div className="about-body">
        <p>
          <strong>The Work</strong> is an independent channel built for one purpose:
          to show the progression of an artistic practice over time. Not a portfolio.
          Not a gallery. A timeline.
        </p>
        <p>
          Every piece posted here is a data point. A sketch, a finished painting,
          a late-night experiment, a study. Each one sits in chronological sequence
          so you can watch the work evolve — technique, style, subject matter, and
          confidence all shifting across months and years.
        </p>
        <p>
          Art is not a product. It is a practice. <strong>This is the practice, made visible.</strong>
        </p>
      </div>

      <div className="about-divider" />

      <h2 className="about-section-title">Why a separate channel?</h2>
      <div className="about-body">
        <p>
          Social media platforms optimize for engagement, not continuity.
          A post from three years ago disappears beneath the algorithm.
          The progression — the whole point — gets buried.
        </p>
        <p>
          Here, chronological order is the design. Posts here also syndicate
          to other platforms automatically, so the work stays visible everywhere —
          but the canonical home lives here, in sequence.
        </p>
      </div>

      <div className="about-divider" />

      <h2 className="about-section-title">Cross-posting</h2>
      <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)', lineHeight: '1.6' }}>
        Each post can be simultaneously published to multiple platforms.
        Configure the relevant API keys in your <code style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '11px' }}>.env.local</code> file.
      </p>
      <div className="about-platform-grid">
        {PLATFORMS.map(p => (
          <div key={p.name} className="platform-card">
            <div className="platform-name">{p.name}</div>
            <div className={`platform-status ${p.status}`}>
              {p.status === 'live' ? '✓ Available' : '⏳ Coming soon'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px', lineHeight: '1.4' }}>
              {p.note}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)' }}>
        See <code style={{ background: 'var(--color-surface)', padding: '2px 5px', borderRadius: 'var(--radius-sm)' }}>DEPLOY.md</code> for full setup instructions.
      </p>

      <div className="about-divider" />

      <h2 className="about-section-title">The artist</h2>
      <div className="about-body">
        <p>
          <strong>Derrick Kempf (DEWD)</strong> — artist, maker, and relentless experimenter.
          Drawing, painting, and building things that probably shouldn&apos;t exist but do anyway.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <a href="https://x.com/derrickkempf" target="_blank" rel="noopener"
           style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-medium)' }}>X →</a>
        <a href="https://instagram.com/derrickkempf" target="_blank" rel="noopener"
           style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-medium)' }}>Instagram →</a>
        <a href="https://dewd.cool" target="_blank" rel="noopener"
           style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-medium)' }}>dewd.cool →</a>
      </div>
    </main>
  )
}
