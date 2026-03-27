'use client';

import { useState } from 'react';

import { apiBaseUrl } from '@/lib/api';

type PrayerResponse = {
  locationLabel: string;
  prayers: Record<string, string>;
  nextPrayer: { name: string; at: string; minutesUntil: number } | null;
  qiblaDegrees: number;
};

const labels: Record<string, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export function PrayerPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrayerResponse | null>(null);

  async function loadTimes() {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `${apiBaseUrl}/api/prayer-times?lat=${position.coords.latitude}&lng=${position.coords.longitude}&method=ummAlQura`,
            { cache: 'no-store' }
          );
          const payload = (await response.json()) as PrayerResponse;
          setResult(payload);
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );
  }

  return (
    <div className="interactive-panel">
      <button className="primary-button" onClick={() => void loadTimes()} disabled={loading}>
        {loading ? 'جاري تحديد الموقع...' : 'احسب مواقيت الصلاة من موقعي'}
      </button>
      {result ? (
        <div className="prayer-grid">
          {Object.entries(result.prayers).map(([key, value]) => (
            <div key={key} className="prayer-tile">
              <span>{labels[key] ?? key}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <div className="prayer-summary">
            <p>الصلاة القادمة: {result.nextPrayer ? `${labels[result.nextPrayer.name] ?? result.nextPrayer.name} - ${result.nextPrayer.at}` : '—'}</p>
            <p>اتجاه القبلة: {result.qiblaDegrees.toFixed(1)}°</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
