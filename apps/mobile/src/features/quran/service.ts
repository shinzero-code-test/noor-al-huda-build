import { z } from 'zod';
import * as FileSystem from 'expo-file-system/legacy';

import { buildFallbackSurahDetail, fallbackSurahs } from '../../data/fallback';
import { getCachedContent, putCachedContent } from '../../lib/sqlite';
import {
  type ReciterDownload,
  type SurahDetail,
  type QuranReciterCollection,
  type QuranTafsirCollection,
  type QuranTranslationCollection,
} from '../../types/domain';

const surahSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  transliteration: z.string(),
  englishName: z.string(),
  versesCount: z.number(),
  revelation: z.enum(['Meccan', 'Medinan']),
});

const surahListSchema = z.array(surahSummarySchema);

const surahDetailSchema = z.object({
  surah: surahSummarySchema,
  verses: z.array(
    z.object({
      number: z.number(),
      arabicText: z.string(),
      translation: z.string(),
      translations: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          text: z.string(),
        })
      ).optional(),
      tafsir: z.object({
        id: z.string(),
        label: z.string(),
        text: z.string(),
      }).nullable().optional(),
    })
  ),
  audioUrl: z.string().optional(),
});

const quranChaptersSchema = z.object({
  chapters: z.array(
    z.object({
      id: z.number(),
      name_arabic: z.string(),
      name_simple: z.string(),
      verses_count: z.number(),
      revelation_place: z.enum(['makkah', 'madinah']),
      translated_name: z.object({ name: z.string() }).optional(),
    })
  ),
});

const quranVersesSchema = z.object({
  verses: z.array(
    z.object({
      verse_number: z.number(),
      text_uthmani: z.string(),
      text_uthmani_tajweed: z.string().optional(),
      translations: z.array(z.object({ text: z.string().optional() })).optional(),
      words: z.array(
        z.object({
          id: z.number(),
          text: z.string().optional(),
          translation: z.object({ text: z.string().optional() }).optional(),
          transliteration: z.object({ text: z.string().optional() }).optional(),
        })
      ).optional(),
    })
  ),
});

const alQuranEditionSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.array(
    z.object({
      identifier: z.string(),
      language: z.string(),
      englishName: z.string(),
      name: z.string(),
      type: z.enum(['translation', 'tafsir', 'quran']),
      direction: z.enum(['ltr', 'rtl']).optional(),
    })
  ),
});

const alQuranSurahEditionsSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.array(
    z.object({
      identifier: z.string(),
      type: z.string(),
      englishName: z.string(),
      name: z.string(),
      ayahs: z.array(
        z.object({
          numberInSurah: z.number(),
          text: z.string(),
        })
      ),
    })
  ),
});

const mp3RecitersSchema = z.object({
  reciters: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      moshaf: z.array(
        z.object({
          server: z.string(),
          surah_list: z.string(),
        })
      ).optional(),
    })
  ),
});

const preferredTranslationLanguages = new Set(['ar', 'en', 'ur', 'fr', 'tr', 'es', 'id', 'ru']);
const defaultTranslationIds = ['en.asad', 'en.pickthall', 'ur.jalandhry', 'fr.hamidullah', 'tr.diyanet', 'es.cortes', 'id.indonesian'];
const defaultTafsirIds = ['ar.muyassar', 'en.asad'];

export async function fetchSurahList() {
  try {
    const response = await fetch('https://api.quran.com/api/v4/chapters?language=en');
    if (!response.ok) {
      throw new Error(`quran-chapters-failed-${response.status}`);
    }
    const payload = quranChaptersSchema.parse(await response.json());
    return surahListSchema.parse(
      payload.chapters.map((chapter) => ({
        id: chapter.id,
        name: chapter.name_arabic,
        transliteration: chapter.name_simple,
        englishName: chapter.translated_name?.name ?? chapter.name_simple,
        versesCount: chapter.verses_count,
        revelation: chapter.revelation_place === 'madinah' ? 'Medinan' : 'Meccan',
      }))
    );
  } catch {
    return fallbackSurahs;
  }
}

export async function fetchTranslationCollections(): Promise<QuranTranslationCollection[]> {
  const cacheKey = 'collections:translations';
  const cached = await getCachedContent<QuranTranslationCollection[]>('quran-meta', cacheKey);
  try {
    const response = await fetch('https://api.alquran.cloud/v1/edition');
    if (!response.ok) {
      throw new Error(`translation-editions-failed-${response.status}`);
    }
    const payload = alQuranEditionSchema.parse(await response.json());
    const result = payload.data
      .filter((item) => item.type === 'translation' && preferredTranslationLanguages.has(item.language))
      .sort((left, right) => Number(defaultTranslationIds.includes(right.identifier)) - Number(defaultTranslationIds.includes(left.identifier)))
      .slice(0, 12)
      .map((item) => ({
        id: item.identifier,
        label: item.language === 'ar' ? `${item.name} (عربي)` : item.englishName,
        language: item.language,
      }));
    await putCachedContent('quran-meta', cacheKey, result);
    return result;
  } catch {
    return cached ?? [
      { id: 'en.asad', label: 'Muhammad Asad', language: 'en' },
      { id: 'en.pickthall', label: 'Pickthall', language: 'en' },
      { id: 'ar.muyassar', label: 'تفسير الميسر (كترجمة عربية)', language: 'ar' },
    ];
  }
}

export async function fetchTafsirCollections(): Promise<QuranTafsirCollection[]> {
  const cacheKey = 'collections:tafsir';
  const cached = await getCachedContent<QuranTafsirCollection[]>('quran-meta', cacheKey);
  try {
    const response = await fetch('https://api.alquran.cloud/v1/edition');
    if (!response.ok) {
      throw new Error(`tafsir-editions-failed-${response.status}`);
    }
    const payload = alQuranEditionSchema.parse(await response.json());
    const result = payload.data
      .filter((item) => item.type === 'tafsir' && defaultTafsirIds.includes(item.identifier))
      .map((item) => ({
        id: item.identifier,
        label: item.language === 'ar' ? item.name : item.englishName,
        language: item.language,
      }));
    await putCachedContent('quran-meta', cacheKey, result);
    return result;
  } catch {
    return cached ?? [
      { id: 'ar.muyassar', label: 'التفسير الميسر', language: 'ar' },
      { id: 'en.asad', label: 'Asad Notes', language: 'en' },
    ];
  }
}

export async function fetchReciterCollections(): Promise<QuranReciterCollection[]> {
  const cacheKey = 'collections:reciters';
  const cached = await getCachedContent<QuranReciterCollection[]>('quran-meta', cacheKey);
  try {
    const response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar');
    if (!response.ok) {
      throw new Error(`reciters-failed-${response.status}`);
    }
    const payload = mp3RecitersSchema.parse(await response.json());
    const result = payload.reciters
      .filter((item) => item.moshaf?.[0]?.server)
      .slice(0, 18)
      .map((item) => ({
        id: String(item.id),
        name: item.name,
        server: item.moshaf?.[0]?.server ?? '',
        surahList: (item.moshaf?.[0]?.surah_list ?? '').split(',').filter(Boolean),
      }));
    await putCachedContent('quran-meta', cacheKey, result);
    return result;
  } catch {
    return cached ?? [
      { id: 'default-afs', name: 'مشاري العفاسي', server: 'https://server8.mp3quran.net/afs/', surahList: Array.from({ length: 114 }, (_, index) => String(index + 1)) },
    ];
  }
}

export async function fetchSurahEnhancements(
  surahId: number,
  translationIds: string[],
  tafsirId: string
) {
  const editions = ['quran-uthmani', ...translationIds, tafsirId].filter(Boolean).join(',');
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/${editions}`);
  if (!response.ok) {
    throw new Error(`surah-enhancements-failed-${response.status}`);
  }
  return alQuranSurahEditionsSchema.parse(await response.json());
}

export async function fetchSurahDetail(
  surahId: number,
  options?: {
    translationIds?: string[];
    tafsirId?: string;
    reciter?: QuranReciterCollection;
  }
): Promise<SurahDetail> {
  const translationIds = options?.translationIds?.length ? options.translationIds : defaultTranslationIds.slice(0, 2);
  const tafsirId = options?.tafsirId ?? defaultTafsirIds[0]!;
  const cacheKey = `v3:${surahId}:${translationIds.join(',')}:${tafsirId}:${options?.reciter?.id ?? 'default'}`;
  const cached = await getCachedContent<z.infer<typeof surahDetailSchema>>('surah', cacheKey);

  try {
    const [surahList, versesResponse, translations, tafsirs, reciters] = await Promise.all([
      fetchSurahList(),
      fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=en&words=true&translations=131&fields=text_uthmani,text_uthmani_tajweed,verse_key&per_page=300`),
      fetchTranslationCollections(),
      fetchTafsirCollections(),
      fetchReciterCollections(),
    ]);
    if (!versesResponse.ok) {
      throw new Error(`quran-surah-failed-${versesResponse.status}`);
    }
    const versesPayload = quranVersesSchema.parse(await versesResponse.json());
    const surah = surahList.find((item) => item.id === surahId) ?? fallbackSurahs[0]!;
    const selectedTranslationIds = translationIds;
    const selectedTafsirId = tafsirId;
    const enhancements = await fetchSurahEnhancements(surahId, selectedTranslationIds, selectedTafsirId).catch(() => null);
    const enhancementMap = new Map((enhancements?.data ?? []).map((edition) => [edition.identifier, edition]));
    const remote = surahDetailSchema.parse({
      surah,
      verses: versesPayload.verses.map((verse) => ({
        number: verse.verse_number,
        arabicText: verse.text_uthmani,
        tajweedText: verse.text_uthmani_tajweed,
        translation: verse.translations?.[0]?.text ?? '',
        translations: selectedTranslationIds.map((id) => ({
          id,
          label: translations.find((item) => item.id === id)?.label ?? id,
          text: enhancementMap.get(id)?.ayahs.find((item) => item.numberInSurah === verse.verse_number)?.text ?? '',
        })),
        tafsir: {
          id: selectedTafsirId,
          label: tafsirs.find((item) => item.id === selectedTafsirId)?.label ?? selectedTafsirId,
          text: enhancementMap.get(selectedTafsirId)?.ayahs.find((item) => item.numberInSurah === verse.verse_number)?.text ?? '',
        },
        words: (verse.words ?? []).map((word) => ({
          id: String(word.id),
          text: word.text ?? '',
          meaning: word.translation?.text ?? '',
          transliteration: word.transliteration?.text ?? '',
          grammar: word.translation?.text ? 'شرح لفظي مختصر' : undefined,
        })),
      })),
      audioUrl: buildReciterAudioUrl(options?.reciter ?? reciters[0], surahId),
    });
    await putCachedContent('surah', cacheKey, remote);
    return remote;
  } catch {
    if (cached) {
      return cached;
    }
    const fallback = buildFallbackSurahDetail(surahId);
    await putCachedContent('surah', cacheKey, fallback);
    return fallback;
  }
}

export function buildReciterAudioUrl(reciter: QuranReciterCollection | undefined, surahId: number) {
  if (!reciter?.server) {
    return `https://server8.mp3quran.net/afs/${String(surahId).padStart(3, '0')}.mp3`;
  }

  return `${reciter.server}${String(surahId).padStart(3, '0')}.mp3`;
}

export async function downloadReciterAudio(reciter: QuranReciterCollection | undefined, surahId: number): Promise<ReciterDownload> {
  const url = buildReciterAudioUrl(reciter, surahId);
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) {
    throw new Error('تعذر الوصول إلى مساحة التخزين المحلية.');
  }
  const fileUri = `${directory}reciters/${reciter?.id ?? 'default'}-${String(surahId).padStart(3, '0')}.mp3`;
  const folderUri = fileUri.split('/').slice(0, -1).join('/');
  await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
  await FileSystem.downloadAsync(url, fileUri);
  const payload: ReciterDownload = {
    surahId,
    reciterId: reciter?.id ?? 'default',
    fileUri,
    downloadedAt: new Date().toISOString(),
  };
  await putCachedContent('quran-downloads', `${payload.reciterId}:${surahId}`, payload);
  return payload;
}

export async function getDownloadedReciterAudio(reciterId: string, surahId: number) {
  return getCachedContent<ReciterDownload>('quran-downloads', `${reciterId}:${surahId}`);
}
