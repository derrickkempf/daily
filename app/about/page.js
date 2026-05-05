export const metadata = {
  title: 'About — Timeline',
  description: 'What this is, why it exists, and how to follow.',
}

export default function AboutPage() {
  return (
    <main className="container container--prose" style={{ padding: 'var(--space-16) 0 var(--space-20)' }}>
      <article className="prose">
        <h1>An independent channel for the work.</h1>

        <p>
          This is a chronological record of art I&apos;m making — sketches, finished pieces, video, the
          occasional dead end. It&apos;s here so the work has a single place that belongs to me, and
          isn&apos;t at the mercy of an algorithm.
        </p>

        <p>
          New posts mirror out to wherever you already follow me. If you&apos;d rather read here, you can.
          If you&apos;d rather like and comment over on X or Instagram, do that. Either way the work shows up.
        </p>

        <h2>What you can do</h2>
        <ul>
          <li>Browse the timeline — the most recent piece is always at the top.</li>
          <li>Sign in with your email to like, comment, or share. One code per request, no password.</li>
          <li>Share any post directly to anywhere with a link or your phone&apos;s native share sheet.</li>
        </ul>

        <h2>What I&apos;m doing here</h2>
        <p>
          I want to make a lot of things and put them somewhere honest. The internet works
          better when artists own their distribution. So this site is the source — every other
          channel is a copy.
        </p>

        <h2>Where else to find me</h2>
        <p>
          <a href="https://x.com/derrickkempf" target="_blank" rel="noopener noreferrer">X</a> ·{' '}
          <a href="https://instagram.com/derrickkempf" target="_blank" rel="noopener noreferrer">Instagram</a> ·{' '}
          <a href="https://www.linkedin.com/in/derrickkempf" target="_blank" rel="noopener noreferrer">LinkedIn</a> ·{' '}
          <a href="https://www.pinterest.com/derrickkempf" target="_blank" rel="noopener noreferrer">Pinterest</a>
        </p>

        <h2>Colophon</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Built with Next.js and Postgres. Designed in the spirit of{' '}
          <a href="https://visualizevalue.com" target="_blank" rel="noopener noreferrer">Visualize Value</a>:
          black on white, borders not shadows, type doing the heavy lifting.
        </p>
      </article>
    </main>
  )
}
