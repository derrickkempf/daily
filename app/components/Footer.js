export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>&copy; {new Date().getFullYear()} Derrick Kempf</div>
        <div className="site-footer__links">
          <a href="https://x.com/derrickkempf" target="_blank" rel="noopener noreferrer">X</a>
          <a href="https://instagram.com/derrickkempf" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.linkedin.com/in/derrickkempf" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="/about">About</a>
        </div>
      </div>
    </footer>
  )
}
