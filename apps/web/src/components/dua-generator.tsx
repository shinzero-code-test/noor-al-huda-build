'use client';

import { useState } from 'react';

import { apiBaseUrl } from '@/lib/api';

type DuaResponse = {
  dua: string;
  sources: string[];
};

export function DuaGenerator() {
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DuaResponse | null>(null);

  async function generate() {
    if (!situation.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/dua/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, language: 'ar' }),
      });
      const payload = (await response.json()) as DuaResponse;
      setResult(payload);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="interactive-panel">
      <label className="field-label" htmlFor="dua-generator">صف حالتك</label>
      <textarea
        id="dua-generator"
        className="text-field text-area"
        dir="rtl"
        placeholder="اكتب ما تريد الدعاء له أو ما تمر به الآن..."
        value={situation}
        onChange={(event) => setSituation(event.target.value)}
      />
      <button className="primary-button" onClick={() => void generate()} disabled={loading || !situation.trim()}>
        {loading ? 'جاري الإنشاء...' : 'أنشئ دعاءً مناسباً'}
      </button>
      {result ? (
        <div className="dua-result">
          <p className="arabic-copy">{result.dua}</p>
          <div className="chip-row">
            {result.sources.map((source) => (
              <span key={source} className="chip">{source}</span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
