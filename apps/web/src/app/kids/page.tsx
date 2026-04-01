import { KidsPanel } from '@/components/kids-panel';
import { SiteShell } from '@/components/site-shell';

export default function KidsPage() {
  return (
    <SiteShell>
      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Kids</p>
          <h2>وضع الأطفال</h2>
        </div>
        <KidsPanel />
      </section>
    </SiteShell>
  );
}
