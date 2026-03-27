'use client';

import { useState } from 'react';

import { apiBaseUrl } from '@/lib/api';

type HalalResult = {
  found: boolean;
  name?: string;
  verdict?: 'haram' | 'doubtful' | 'likely_halal';
  ingredients_raw?: string;
  disclaimer?: string;
};

export function HalalPanel() {
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState<HalalResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    if (!barcode.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/halal/scan?barcode=${encodeURIComponent(barcode)}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as HalalResult;
      setResult(payload);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="interactive-panel">
      <label className="field-label" htmlFor="halal-barcode">افحص منتجاً</label>
      <div className="inline-field-row">
        <input
          id="halal-barcode"
          className="text-field"
          dir="ltr"
          placeholder="737628064502"
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
        />
        <button className="primary-button secondary-inline" onClick={() => void scan()} disabled={loading || !barcode.trim()}>
          {loading ? '...' : 'تحليل'}
        </button>
      </div>
      {result ? (
        <div className="halal-result">
          <p className={`verdict ${result.verdict ?? 'likely_halal'}`}>
            {result.verdict === 'haram' ? 'غير حلال' : result.verdict === 'doubtful' ? 'يحتاج تحقق' : 'غالباً حلال'}
          </p>
          <h4>{result.name ?? 'نتيجة المنتج'}</h4>
          <p>{result.ingredients_raw ?? 'لا توجد مكونات متاحة.'}</p>
          <p className="panel-note">{result.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
