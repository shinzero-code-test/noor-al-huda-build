import type { Metadata } from 'next';
import { Amiri, Cairo } from 'next/font/google';

import './globals.css';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });
const amiri = Amiri({ subsets: ['arabic', 'latin'], weight: ['400', '700'], variable: '--font-amiri' });

export const metadata: Metadata = {
  title: 'Noor Al Huda | نور الهدى',
  description: 'Arabic-first Islamic web experience for Quran, prayer times, dua, semantic search, and daily guidance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
