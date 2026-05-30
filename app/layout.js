import './globals.css';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Inter, JetBrains_Mono } from 'next/font/google';
import CustomCursor from '@/components/CustomCursor';
import TelegramFloatingWidget from '@/components/TelegramFloatingWidget';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'Pollapse — Cross-Market Intelligence for Polymarket',
  description: 'Discover hidden correlations, detect divergences, and build multi-market theses on Polymarket. The intelligence layer that sees what others can\'t.',
  openGraph: {
    title: 'Pollapse — Cross-Market Intelligence for Polymarket',
    description: 'Discover hidden correlations, detect divergences, and build multi-market theses on Polymarket.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pollapse — Cross-Market Intelligence for Polymarket',
    description: 'The intelligence layer for prediction markets.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <CustomCursor />
        <div className="bg-mesh-glow">
          <div className="bg-sphere-1"></div>
          <div className="bg-sphere-2"></div>
        </div>
        <Navbar />
        <div className="page-wrapper">
          {children}
        </div>
        <TelegramFloatingWidget />
        <footer className="footer">
          <div className="container">
            <p>
              Built by{' '}
              <a
                href="https://github.com/Lesnak1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover-link"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  letterSpacing: '0.3px',
                  display: 'inline-block',
                  textShadow: '0 0 12px rgba(139, 92, 246, 0.15)',
                }}
              >
                Leknax
              </a>
              {' '}· Powered by{' '}
              <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">Polymarket</a> CLOB V2
            </p>
            <div className="footer-links">
              <a href="https://x.com/LesnaCrex" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Twitter / X</a>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <Link href="/docs">Documentation & API</Link>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <Link href="/legal">Compliance & Disclaimers</Link>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <a href="https://docs.polymarket.com" target="_blank" rel="noopener noreferrer">Polymarket API Docs</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
