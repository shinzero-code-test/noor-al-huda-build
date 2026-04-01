import { KhatmPanel } from '@/components/khatm-panel';
import { SiteShell } from '@/components/site-shell';

export default function KhatmPage() {
  return (
    <SiteShell>
      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Khatm</p>
          <h2>الختمة الجماعية</h2>
        </div>
        <KhatmPanel />
      </section>
    </SiteShell>
  );
}
