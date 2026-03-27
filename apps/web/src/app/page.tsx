import Image from 'next/image';

import { FeatureCard } from '@/components/feature-card';
import { DuaGenerator } from '@/components/dua-generator';
import { HalalPanel } from '@/components/halal-panel';
import { PrayerPanel } from '@/components/prayer-panel';
import { SemanticSearch } from '@/components/semantic-search';
import { apiJson } from '@/lib/api';

type DailyPayload = {
  ayah: { text: string; reference: string; surahName: string };
  hadith: { title: string; text: string; source: string };
};

type RadioPayload = Array<{ id: string; name: string; country: string; description: string }>;

export default async function HomePage() {
  const [daily, radios] = await Promise.all([
    apiJson<DailyPayload>('/api/daily-content').catch(() => null),
    apiJson<RadioPayload>('/api/radios').catch(() => []),
  ]);

  return (
    <main className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <Image src="/logo-mark.svg" alt="نور الهدى" className="hero-logo" width={88} height={88} priority />
          <p className="eyebrow">منصّة ويب عربية أولاً</p>
          <h1>نور الهدى على الويب</h1>
          <p className="hero-text">
            نسخة ويب حديثة مبنية بـ Next.js لتقديم القرآن، مواقيت الصلاة، توليد الدعاء، البحث الدلالي، والإرشاد اليومي من خلال واجهات سريعة وجميلة.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#interactive">ابدأ التفاعل الآن</a>
            <a className="ghost-button" href="https://noor-al-huda-api.shinzero.workers.dev/api/health" target="_blank" rel="noreferrer">حالة الواجهة الخلفية</a>
          </div>
        </div>
        <div className="hero-panel">
          <div className="metric-card">
            <span>محرك الخلفية</span>
            <strong>Cloudflare Worker</strong>
          </div>
          <div className="metric-card">
            <span>البحث الدلالي</span>
            <strong>Quran Vectorize</strong>
          </div>
          <div className="metric-card">
            <span>الهوية</span>
            <strong>RTL + Responsive</strong>
          </div>
        </div>
      </header>

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">المحتوى اليومي</p>
          <h2>بطاقة روحية يومية</h2>
        </div>
        <div className="content-grid two-up">
          <FeatureCard
            eyebrow="آية اليوم"
            title={daily?.ayah.reference ?? 'البطاقة القرآنية'}
            description={daily?.ayah.surahName ?? 'من التغذية اليومية لتطبيق نور الهدى'}
          >
            <p className="arabic-copy">{daily?.ayah.text ?? 'سيظهر هنا محتوى الآية اليومية عند توفر الخادم.'}</p>
          </FeatureCard>
          <FeatureCard
            eyebrow={daily?.hadith.title ?? 'حديث اليوم'}
            title={daily?.hadith.source ?? 'مصدر الحديث'}
            description="مقتطف موثوق من خدمة الحديث اليومية"
          >
            <p className="body-copy">{daily?.hadith.text ?? 'سيظهر هنا الحديث اليومي عند توفر الخادم.'}</p>
          </FeatureCard>
        </div>
      </section>

      <section className="section-block" id="interactive">
        <div className="section-heading">
          <p className="eyebrow">أدوات تفاعلية</p>
          <h2>جرّب أهم خصائص نور الهدى على المتصفح</h2>
        </div>
        <div className="content-grid interactive-grid">
          <FeatureCard eyebrow="بحث دلالي" title="ابحث في القرآن بالمعنى" description="يستخدم خادم نور الهدى + Vectorize لإرجاع آيات ذات صلة دلالية.">
            <SemanticSearch />
          </FeatureCard>
          <FeatureCard eyebrow="دعاء" title="أنشئ دعاءً مناسباً" description="دعاء عربي مخصص مستند إلى مصادر إسلامية من واجهة الذكاء الاصطناعي.">
            <DuaGenerator />
          </FeatureCard>
          <FeatureCard eyebrow="الصلاة" title="مواقيت الصلاة من موقعك" description="احسب المواقيت واتجاه القبلة بسرعة من خدمة الصلاة المباشرة.">
            <PrayerPanel />
          </FeatureCard>
          <FeatureCard eyebrow="الحلال" title="افحص المنتجات" description="تحليل سريع للمكونات باستخدام Open Food Facts عبر Cloudflare Worker.">
            <HalalPanel />
          </FeatureCard>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">إذاعات</p>
          <h2>محطات مختارة</h2>
        </div>
        <div className="content-grid three-up">
          {radios.slice(0, 3).map((radio) => (
            <FeatureCard key={radio.id} eyebrow={radio.country} title={radio.name} description={radio.description} />
          ))}
        </div>
      </section>

      <section className="section-block footer-strip">
        <div>
          <p className="eyebrow">Deployment</p>
          <h2>جاهز للنشر على Vercel</h2>
        </div>
        <p className="body-copy">
          اخترت Vercel لهذا المشروع لأنه الأنسب لـ Next.js من حيث سرعة النشر، SSR، وتحسين تجربة المطور.
        </p>
      </section>
    </main>
  );
}
