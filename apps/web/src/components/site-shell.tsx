import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AuthPanel } from '@/components/auth-panel';

const navItems = [
  { href: '/', label: 'الرئيسية' },
  { href: '/quran', label: 'القرآن' },
  { href: '/radios', label: 'الإذاعات' },
  { href: '/tracker', label: 'المتابعة' },
  { href: '/settings', label: 'الإعدادات' },
  { href: '/features', label: 'كل الميزات' },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="site-brand">
          <Image src="/logo-mark.svg" alt="نور الهدى" className="site-logo" width={54} height={54} />
          <div>
            <p className="eyebrow">Noor Al Huda</p>
            <h1 className="site-title">نور الهدى</h1>
          </div>
        </div>
        <nav className="site-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <AuthPanel />
      </header>
      {children}
    </div>
  );
}
