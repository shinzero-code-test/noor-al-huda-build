'use client';

import { useMemo, useState } from 'react';

const alphabet = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص'];
const stories = [
  { id: 'ibrahim', title: 'قصة إبراهيم', body: 'تعلّم سيدنا إبراهيم كيف يثبت على التوحيد ويطلب الهداية بلطف وحكمة.' },
  { id: 'musa', title: 'قصة موسى', body: 'قصة موسى تعلم الطفل الشجاعة والرحمة ومساندة المظلوم.' },
  { id: 'isa', title: 'قصة عيسى', body: 'قصة عيسى تذكّر الطفل باللطف والرحمة وطهارة القلب.' },
  { id: 'muhammad', title: 'سيرة النبي ﷺ', body: 'سيرة النبي محمد ﷺ تعلم الصدق والأمانة والرحمة مع الجميع.' },
];

const shortSurahs = [
  { id: 1, title: 'الفاتحة', excerpt: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
  { id: 112, title: 'الإخلاص', excerpt: 'قُلْ هُوَ اللَّهُ أَحَدٌ' },
  { id: 113, title: 'الفلق', excerpt: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ' },
  { id: 114, title: 'الناس', excerpt: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ' },
];

export function KidsPanel() {
  const [tab, setTab] = useState<'letters' | 'surahs' | 'stories' | 'rewards'>('letters');
  const [stars, setStars] = useState(0);
  const [activeStory, setActiveStory] = useState(stories[0]);

  const rewardMosaic = useMemo(() => Array.from({ length: Math.max(4, stars) }, (_, index) => index), [stars]);

  function speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
  }

  return (
    <div className="settings-shell">
      <div className="chip-row">
        <button className={`ghost-button ${tab === 'letters' ? 'active-chip' : ''}`} onClick={() => setTab('letters')}>الحروف</button>
        <button className={`ghost-button ${tab === 'surahs' ? 'active-chip' : ''}`} onClick={() => setTab('surahs')}>السور القصيرة</button>
        <button className={`ghost-button ${tab === 'stories' ? 'active-chip' : ''}`} onClick={() => setTab('stories')}>قصص الأنبياء</button>
        <button className={`ghost-button ${tab === 'rewards' ? 'active-chip' : ''}`} onClick={() => setTab('rewards')}>مكافآتي</button>
      </div>

      {tab === 'letters' ? (
        <div className="kids-grid">
          {alphabet.map((letter) => (
            <button
              key={letter}
              className="kid-letter-card"
              onClick={() => {
                speak(letter);
                setStars((value) => value + 1);
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      ) : null}

      {tab === 'surahs' ? (
        <div className="content-grid two-up">
          {shortSurahs.map((surah) => (
            <article key={surah.id} className="feature-card">
              <p className="feature-eyebrow">سورة قصيرة</p>
              <h3>{surah.title}</h3>
              <p className="arabic-copy">{surah.excerpt}</p>
              <button className="ghost-button" onClick={() => { speak(surah.excerpt); setStars((value) => value + 1); }}>استمع</button>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'stories' ? (
        <div className="content-grid two-up">
          <div className="feature-card">
            <div className="chip-row">
              {stories.map((story) => (
                <button key={story.id} className={`ghost-button ${activeStory.id === story.id ? 'active-chip' : ''}`} onClick={() => setActiveStory(story)}>{story.title}</button>
              ))}
            </div>
            <h3>{activeStory.title}</h3>
            <p className="body-copy">{activeStory.body}</p>
            <button className="ghost-button" onClick={() => { speak(activeStory.body); setStars((value) => value + 1); }}>اقرأها لي</button>
          </div>
        </div>
      ) : null}

      {tab === 'rewards' ? (
        <div className="feature-card">
          <p className="feature-eyebrow">النجوم</p>
          <h3>{stars} ⭐</h3>
          <div className="rewards-mosaic">
            {rewardMosaic.map((item) => (
              <div key={item} className="reward-star">⭐</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
