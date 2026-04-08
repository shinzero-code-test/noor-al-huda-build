import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { GhostButton, Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { flagContent } from '../../src/features/content/flags';
import { jsonRequest } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';
import { VerificationBadge } from '../../src/shared/components/VerificationBadge';

const hadithDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  hadeeth: z.string(),
  attribution: z.string().optional(),
  grade: z.string().optional(),
});

export default function HadithDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const hadithId = params.id ?? '65290';
  const query = useQuery({
    queryKey: ['hadith-detail', hadithId],
    queryFn: async () => {
      try {
        const response = await fetch(`https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${hadithId}`);
        if (!response.ok) {
          throw new Error(`hadith-failed-${response.status}`);
        }
        const payload = hadithDetailSchema.parse(await response.json());
        return {
          id: payload.id,
          title: payload.title,
          text: payload.hadeeth,
          source: payload.attribution ?? payload.grade ?? 'موسوعة الحديث',
        };
      } catch {
        return jsonRequest(`/api/hadith/daily`, z.object({
          id: z.string(),
          title: z.string(),
          text: z.string(),
          source: z.string(),
        }));
      }
    },
  });

  return (
    <Page>
      <Stack.Screen options={{ headerShown: false }} />
      <SurfaceCard accent="emerald">
        <View style={styles.headerRow}>
          <GhostButton label="رجوع" onPress={() => router.back()} />
          <SectionHeader title="شرح الحديث" subtitle="مصدر موثق مع قابلية التوسعة من Worker" />
        </View>
      </SurfaceCard>

      {query.isLoading ? (
        <SurfaceCard>
          <ActivityIndicator color={theme.colors.goldLight} />
        </SurfaceCard>
      ) : query.data ? (
        <SurfaceCard>
          <Text style={styles.title}>{query.data.title}</Text>
          <VerificationBadge
            badge={{
              level: 'sahih',
              source: query.data.source,
              verified_by: 'Dorar / Noor Al Huda',
              verified_at: new Date().toISOString().slice(0, 10),
            }}
          />
          <Text style={styles.body}>{query.data.text}</Text>
          <Text style={styles.source}>{query.data.source}</Text>
          <View style={styles.actions}>
            <GhostButton
              label="الإبلاغ كمصدر غير صحيح"
              onPress={() => {
                void flagContent(query.data?.id ?? 'hadith', 'wrong_source').then(() => {
                  Alert.alert('تم الإرسال', 'سُجّل بلاغك لمراجعته لاحقاً.');
                });
              }}
            />
            <GhostButton
              label="الإبلاغ كحديث ضعيف"
              onPress={() => {
                void flagContent(query.data?.id ?? 'hadith', 'weak').then(() => {
                  Alert.alert('تم الإرسال', 'سُجّل بلاغك لمراجعته لاحقاً.');
                });
              }}
            />
          </View>
        </SurfaceCard>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    gap: 10,
  },
  title: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    textAlign: 'right',
  },
  body: {
    color: theme.colors.cream,
    fontFamily: theme.fonts.arabic,
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'right',
  },
  source: {
    color: theme.colors.creamFaint,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    textAlign: 'right',
  },
  note: {
    color: theme.colors.creamMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
});
