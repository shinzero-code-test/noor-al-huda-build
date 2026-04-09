import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GhostButton, Page, PrimaryButton, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { SelectSheet } from '../../src/components/SelectSheet';
import { useAuthUser } from '../../src/features/auth/service';
import { buildReciterAudioUrl, downloadReciterAudio, fetchReciterCollections, fetchSurahDetail, fetchTafsirCollections, fetchTranslationCollections, getDownloadedReciterAudio } from '../../src/features/quran/service';
import { useAudioPlayer } from '../../src/hooks/useAudioPlayer';
import { theme } from '../../src/lib/theme';
import { useAppStore } from '../../src/store/app-store';

export default function SurahDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ surah: string }>();
  const parsedSurahId = Number(params.surah ?? 1);
  const surahId = Number.isFinite(parsedSurahId) && parsedSurahId > 0 ? parsedSurahId : 1;
  const bookmarks = useAppStore((state) => state.bookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const setLastReadSurahId = useAppStore((state) => state.setLastReadSurahId);
  const settings = useAppStore((state) => state.settings);
  const setReciter = useAppStore((state) => state.setReciter);
  const setQuranFontScale = useAppStore((state) => state.setQuranFontScale);
  const setQuranFontFamily = useAppStore((state) => state.setQuranFontFamily);
  const { user } = useAuthUser();
  const audioPlayer = useAudioPlayer();
  const [selectedTranslationId, setSelectedTranslationId] = useState('en.asad');
  const [selectedTafsirId, setSelectedTafsirId] = useState('ar.muyassar');
  const [downloadedAudioUri, setDownloadedAudioUri] = useState<string | null>(null);

  const translationsQuery = useQuery({ queryKey: ['translation-collections'], queryFn: fetchTranslationCollections });
  const tafsirQuery = useQuery({ queryKey: ['tafsir-collections'], queryFn: fetchTafsirCollections });
  const recitersQuery = useQuery({ queryKey: ['reciter-collections'], queryFn: fetchReciterCollections });

  const selectedReciter = useMemo(
    () => recitersQuery.data?.find((item) => item.name === settings.reciter) ?? recitersQuery.data?.[0],
    [recitersQuery.data, settings.reciter]
  );
  const targetAudio = useMemo(() => buildReciterAudioUrl(selectedReciter, surahId), [selectedReciter, surahId]);

  useEffect(() => {
    let mounted = true;
    if (!selectedReciter) {
      setDownloadedAudioUri(null);
      return;
    }
    void getDownloadedReciterAudio(selectedReciter.id, surahId).then((item) => {
      if (mounted) {
        setDownloadedAudioUri(item?.fileUri ?? null);
      }
    });
    return () => {
      mounted = false;
    };
  }, [selectedReciter, surahId]);

  const surahQuery = useQuery({
    queryKey: ['surah-detail', surahId, selectedTranslationId, selectedTafsirId, selectedReciter?.id],
    queryFn: () =>
      fetchSurahDetail(surahId, {
        translationIds: [selectedTranslationId],
        tafsirId: selectedTafsirId,
        reciter: selectedReciter,
      }),
  });

  const bookmark = useMemo(
    () => ({
      surahId,
      surahName: surahQuery.data?.surah.name ?? 'سورة',
      ayahNumber: 1,
      createdAt: new Date().toISOString(),
    }),
    [surahId, surahQuery.data?.surah.name]
  );

  const isBookmarked = bookmarks.some(
    (item) => item.surahId === surahId && item.ayahNumber === bookmark.ayahNumber
  );

  useEffect(() => {
    setLastReadSurahId(surahId);
  }, [setLastReadSurahId, surahId]);

  async function handleBookmark() {
    const detail = surahQuery.data;
    if (!detail) {
      return;
    }

    toggleBookmark({ ...bookmark, surahName: detail.surah.name, createdAt: new Date().toISOString() });
    Alert.alert(
      isBookmarked ? 'أزيلت الإشارة' : 'تم الحفظ',
      user
        ? isBookmarked
          ? 'أزيلت السورة من الإشارات المرجعية وسيتم تحديث Firebase تلقائياً.'
          : 'حُفظت السورة ضمن الإشارات المرجعية وسيتم رفعها إلى Firebase تلقائياً.'
        : isBookmarked
          ? 'أزيلت السورة من الإشارات المرجعية المحلية.'
          : 'حُفظت السورة ضمن الإشارات المرجعية المحلية.'
    );
  }

  return (
    <Page>
      <Stack.Screen options={{ headerShown: false }} />
      <SurfaceCard accent="emerald">
        <View style={styles.topRow}>
          <GhostButton label="رجوع" onPress={() => router.back()} />
          <View style={styles.topMeta}>
            <Text style={styles.topTitle}>السورة</Text>
            <Text style={styles.topValue}>{surahId}</Text>
          </View>
        </View>
      </SurfaceCard>

      {surahQuery.isLoading ? (
        <SurfaceCard>
          <ActivityIndicator color={theme.colors.goldLight} />
        </SurfaceCard>
      ) : surahQuery.data ? (
        <>
          <SurfaceCard>
            <SectionHeader
              title={surahQuery.data.surah.name}
              subtitle={`${surahQuery.data.surah.transliteration} · ${surahQuery.data.surah.versesCount} آية`}
            />
            <View style={styles.selectorGroup}>
              <SelectSheet
                label="الترجمة"
                value={selectedTranslationId}
                options={(translationsQuery.data ?? []).map((item) => ({ value: item.id, label: item.label }))}
                onSelect={setSelectedTranslationId}
              />
              <SelectSheet
                label="التفسير"
                value={selectedTafsirId}
                options={(tafsirQuery.data ?? []).map((item) => ({ value: item.id, label: item.label }))}
                onSelect={setSelectedTafsirId}
              />
              <SelectSheet
                label="القارئ"
                value={selectedReciter?.id ?? ''}
                options={(recitersQuery.data ?? []).map((item) => ({ value: item.id, label: item.name }))}
                onSelect={(value) => {
                  const next = recitersQuery.data?.find((item) => item.id === value);
                  if (next) {
                    setReciter(next.name);
                  }
                }}
              />
              <SelectSheet
                label="الخط"
                value={settings.quranFontFamily ?? 'naskh'}
                options={[
                  { value: 'naskh', label: 'نسخ' },
                  { value: 'amiri', label: 'أميري' },
                ]}
                onSelect={(value) => setQuranFontFamily(value as 'naskh' | 'amiri')}
              />
              <SelectSheet
                label="الحجم"
                value={String(settings.quranFontScale ?? 1)}
                options={[
                  { value: '0.9', label: 'صغير' },
                  { value: '1', label: 'متوسط' },
                  { value: '1.15', label: 'كبير' },
                  { value: '1.3', label: 'كبير جداً' },
                ]}
                onSelect={(value) => setQuranFontScale(Number(value))}
              />
            </View>
            <View style={styles.actionRow}>
              {targetAudio ? (
                <PrimaryButton
                  label={
                    audioPlayer.currentUrl === (downloadedAudioUri ?? targetAudio) && audioPlayer.isPlaying
                      ? 'إيقاف مؤقت'
                      : 'استماع'
                  }
                  onPress={() => {
                    const activeAudio = downloadedAudioUri ?? targetAudio;
                    if (audioPlayer.currentUrl === activeAudio) {
                      void audioPlayer.toggle();
                    } else if (activeAudio) {
                      void audioPlayer.play(activeAudio, `${surahQuery.data.surah.name} - ${selectedReciter?.name ?? 'القارئ الافتراضي'}`);
                    }
                  }}
                />
              ) : null}
              <GhostButton
                label={downloadedAudioUri ? 'تم التحميل' : 'تحميل التلاوة'}
                onPress={() => {
                  if (!selectedReciter) return;
                  void downloadReciterAudio(selectedReciter, surahId)
                    .then((item) => {
                      setDownloadedAudioUri(item.fileUri);
                      Alert.alert('تم التحميل', 'أصبحت التلاوة متاحة بدون إنترنت.');
                    })
                    .catch((error) => {
                      Alert.alert('تعذر التحميل', error instanceof Error ? error.message : 'حدث خطأ أثناء التحميل.');
                    });
                }}
              />
              <GhostButton label={isBookmarked ? 'إزالة الإشارة' : 'إشارة مرجعية'} onPress={() => void handleBookmark()} />
            </View>
            {selectedReciter ? <Text style={styles.audioMeta}>القارئ الحالي: {selectedReciter.name}</Text> : null}
          </SurfaceCard>

          {surahQuery.data.verses.map((verse: Awaited<ReturnType<typeof fetchSurahDetail>>['verses'][number]) => (
            <SurfaceCard key={verse.number} accent="gold">
              <Text style={styles.verseNumber}>الآية {verse.number}</Text>
              <TajweedText
                text={verse.tajweedText ?? verse.arabicText}
                fontFamily={settings.quranFontFamily ?? 'naskh'}
                fontScale={settings.quranFontScale ?? 1}
              />
              {verse.words?.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wordsRow}>
                  {verse.words.map((word) => (
                    <GhostButton
                      key={word.id}
                      label={word.transliteration || word.text || 'كلمة'}
                      onPress={() =>
                        Alert.alert(
                          word.text || 'كلمة',
                          [word.meaning ? `المعنى: ${word.meaning}` : '', word.grammar ? `الشرح: ${word.grammar}` : '']
                            .filter(Boolean)
                            .join('\n') || 'لا توجد تفاصيل إضافية.'
                        )
                      }
                    />
                  ))}
                </ScrollView>
              ) : null}
              <Text style={styles.verseTranslation}>{verse.translations?.find((item) => item.id === selectedTranslationId)?.text ?? verse.translation}</Text>
              {verse.tafsir?.text ? <Text style={styles.tafsirText}>{verse.tafsir.text}</Text> : null}
            </SurfaceCard>
          ))}
        </>
      ) : null}
    </Page>
  );
}

function TajweedText({
  text,
  fontFamily,
  fontScale,
}: {
  text: string;
  fontFamily: 'naskh' | 'amiri';
  fontScale: number;
}) {
  const parts = text.split(/(<\/?.+?>)/g).filter(Boolean);
  let activeClass = '';

  return (
    <Text
      style={[
        styles.verseArabic,
        {
          fontFamily: fontFamily === 'amiri' ? theme.fonts.display : theme.fonts.arabic,
          fontSize: 24 * fontScale,
          lineHeight: 42 * fontScale,
        },
      ]}
    >
      {parts.map((part, index) => {
        if (part.startsWith('<tajweed')) {
          const match = part.match(/class=([^ >]+)/);
          activeClass = match?.[1]?.replace(/['"]/g, '') ?? '';
          return null;
        }
        if (part.startsWith('</tajweed')) {
          activeClass = '';
          return null;
        }
        if (part.startsWith('<span')) {
          return null;
        }
        if (part.startsWith('</span')) {
          return null;
        }
        return (
          <Text key={`${part}-${index}`} style={getTajweedStyle(activeClass)}>
            {part.replace(/<[^>]+>/g, '')}
          </Text>
        );
      })}
    </Text>
  );
}

function getTajweedStyle(kind: string) {
  switch (kind) {
    case 'madda_normal':
    case 'madda_permissible':
      return { color: '#60A5FA' };
    case 'laam_shamsiyah':
      return { color: '#F59E0B' };
    case 'ham_wasl':
      return { color: '#34D399' };
    default:
      return { color: theme.colors.cream };
  }
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topMeta: {
    alignItems: 'flex-end',
  },
  topTitle: {
    color: theme.colors.creamFaint,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  topValue: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBlack,
    fontSize: 26,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  selectorGroup: {
    gap: 10,
  },
  audioMeta: {
    color: theme.colors.creamFaint,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    textAlign: 'right',
  },
  verseNumber: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    textAlign: 'right',
  },
  verseArabic: {
    color: theme.colors.cream,
    fontFamily: theme.fonts.arabic,
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'right',
  },
  verseTranslation: {
    color: theme.colors.creamMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
  tafsirText: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
  wordsRow: {
    gap: 8,
  },
});
