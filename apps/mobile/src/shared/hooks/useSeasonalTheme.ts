import { useMemo } from 'react';

import { type PrayerTimesData } from '../../types/domain';
import { SEASONAL_THEMES } from '../themes/seasonal';

function getHijriMonthDay(reference = new Date()) {
  const parts = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(reference);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { month: Number(lookup.month), day: Number(lookup.day) };
}

function parsePrayerClock(value?: string) {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

export function useSeasonalTheme(prayerTimes?: PrayerTimesData, forcedMode?: 'auto' | 'ramadan') {
  return useMemo(() => {
    if (forcedMode === 'ramadan') {
      return SEASONAL_THEMES.ramadan;
    }
    const hijri = getHijriMonthDay();
    if (hijri.month === 9) return SEASONAL_THEMES.ramadan;
    if (hijri.month === 10 && hijri.day <= 3) return SEASONAL_THEMES.eid;
    if (hijri.month === 12 && hijri.day >= 8) return SEASONAL_THEMES.hajj;
    if (hijri.month === 1 && hijri.day <= 10) return SEASONAL_THEMES.muharram;
    if (hijri.month === 3 && hijri.day >= 10 && hijri.day <= 18) return SEASONAL_THEMES.mawlid;

    const now = new Date();
    const isha = parsePrayerClock(prayerTimes?.prayers.isha);
    const maghrib = parsePrayerClock(prayerTimes?.prayers.maghrib);
    const asr = parsePrayerClock(prayerTimes?.prayers.asr);
    const dhuhr = parsePrayerClock(prayerTimes?.prayers.dhuhr);
    const fajr = parsePrayerClock(prayerTimes?.prayers.fajr);

    if (isha && now >= isha) return SEASONAL_THEMES.isha;
    if (maghrib && now >= maghrib) return SEASONAL_THEMES.maghrib;
    if (asr && now >= asr) return SEASONAL_THEMES.asr;
    if (dhuhr && now >= dhuhr) return SEASONAL_THEMES.dhuhr;
    if (fajr && now >= fajr) return SEASONAL_THEMES.fajr;
    return SEASONAL_THEMES.default_dark;
  }, [forcedMode, prayerTimes]);
}
