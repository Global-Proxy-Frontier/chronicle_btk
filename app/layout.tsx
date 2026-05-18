import type {Metadata} from 'next';
import { Manrope, Sora } from 'next/font/google';
import './globals.css';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

const displayFont = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Chronicle AML Platform',
  description: '1000 kayit precompute + 5 canli local analiz AML platformu',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="tr">
      <body
        suppressHydrationWarning
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
