import './globals.css'
import Nav from './components/Nav'
import Footer from './components/Footer'

export const metadata = {
  title: 'The Work — Art Timeline',
  description: 'A living record of creative evolution. Artworks, sketches, and thoughts posted to the world.',
  openGraph: {
    title: 'The Work',
    description: 'A living record of creative evolution.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
