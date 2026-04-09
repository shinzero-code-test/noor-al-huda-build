export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface AppLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export interface PrayerTimesData {
  locationLabel: string;
  method: string;
  source: 'worker' | 'local';
  prayers: Record<PrayerName, string>;
  qiblaDegrees: number;
  nextPrayer: {
    name: PrayerName;
    at: string;
    minutesUntil: number;
  } | null;
}

export interface SurahSummary {
  id: number;
  name: string;
  transliteration: string;
  englishName: string;
  versesCount: number;
  revelation: 'Meccan' | 'Medinan';
}

export interface SurahVerse {
  number: number;
  arabicText: string;
  translation: string;
  translations?: Array<{
    id: string;
    label: string;
    text: string;
  }>;
  tafsir?: {
    id: string;
    label: string;
    text: string;
  } | null;
}

export interface SurahDetail {
  surah: SurahSummary;
  verses: SurahVerse[];
  audioUrl?: string;
}

export interface RamadanInfo {
  dayNumber: number;
  fastingMessage: string;
  iftarTime: string;
  suhoorTip: string;
}

export interface QuranTranslationCollection {
  id: string;
  label: string;
  language: string;
}

export interface QuranTafsirCollection {
  id: string;
  label: string;
  language: string;
}

export interface QuranReciterCollection {
  id: string;
  name: string;
  server: string;
  surahList: string[];
}

export interface HadithCard {
  id: string;
  title: string;
  text: string;
  source: string;
}

export interface AyahCard {
  surahId: number;
  surahName: string;
  reference: string;
  text: string;
}

export interface DailyContent {
  ayah: AyahCard;
  hadith: HadithCard;
}

export interface AzkarEntry {
  id: string;
  text: string;
  count: number;
  virtue: string;
  collectionTitle?: string;
}

export type AzkarCollection = 'morning' | 'evening' | 'after-prayer';

export interface RadioStation {
  id: string;
  name: string;
  country: string;
  description: string;
  streamUrl: string;
}

export interface HadithCollection {
  id: string;
  title: string;
  count: number;
}

export interface Bookmark {
  surahId: number;
  surahName: string;
  ayahNumber: number;
  createdAt: string;
}

export interface UserSettings {
  location: AppLocation;
  calculationMethod: string;
  reciter: string;
  notificationsEnabled: boolean;
  seasonalMode?: 'auto' | 'ramadan';
}
