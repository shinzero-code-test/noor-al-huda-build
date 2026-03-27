import type { ReactNode } from 'react';

export function FeatureCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="feature-card">
      <p className="feature-eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p className="feature-description">{description}</p>
      {children}
    </section>
  );
}
