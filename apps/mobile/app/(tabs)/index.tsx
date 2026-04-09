import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  EmptyState,
  GhostButton,
  MetricTile,
  Page,
  PrimaryButton,
  SectionHeader,
  SurfaceCard,
} from '../../src/components/ui';
import { fetchDailyContent } from '../../src/features/daily/service';
import {
  authActions,
  mapFirebaseAuthError,
  useAuthUser,
} from '../../src/features/auth/service';
import { AuthWindow } from '../../src/features/auth/components/AuthWindow';
import { buildRamadanInfo, fetchPrayerTimes } from '../../src/features/prayer/service';
import { formatFullDate, formatMinutes, prayerLabels } from '../../src/lib/formatting';
import { syncUserSettings } from '../../src/lib/firebase';
import { theme } from '../../src/lib/theme';
import { useSeasonalTheme } from '../../src/shared/hooks/useSeasonalTheme';
import { updatePrayerWidget } from '../../src/features/widgets/WidgetBridge';
import { storage } from '../../src/lib/mmkv';
import { useAppStore } from '../../src/store/app-store';

export default function HomeScreen() {
  const settings = useAppStore((state) => state.settings);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const { initializing, user, refresh } = useAuthUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const prayerQuery = useQuery({
    queryKey: ['prayer-home', settings.location, settings.calculationMethod],
    queryFn: () => fetchPrayerTimes(settings.location, settings.calculationMethod),
  });

  const dailyQuery = useQuery({
    queryKey: ['daily-content'],
    queryFn: fetchDailyContent,
  });

  const userLabel = useMemo(() => {
    if (!user) {
      return 'غير مسجل';
    }

    return user.isAnonymous
      ? 'ضيف'
      : user.displayName || user.email || 'مستخدم نور الهدى';
  }, [user]);

  async function handleAction(action: () => Promise<unknown>, successMessage: string) {
    setAuthLoading(true);
    try {
      await action();
      Alert.alert('تم', successMessage);
      setPassword('');
    } catch (error) {
      Alert.alert(
        'تعذر التنفيذ',
        error instanceof Error ? mapFirebaseAuthError(error.message) : 'حاول مرة أخرى.'
      );
    } finally {
      setAuthLoading(false);
    }
  }

  const needsVerification = Boolean(user && !user.isAnonymous && user.email && !user.emailVerified);
  const nextPrayerLabel = prayerQuery.data?.nextPrayer
    ? `${prayerLabels[prayerQuery.data.nextPrayer.name]} بعد ${formatMinutes(
        prayerQuery.data.nextPrayer.minutesUntil
      )}`
    : 'جارٍ حساب المواقيت';

  const recentBookmarks = bookmarks.slice(0, 2);
  const seasonalTheme = useSeasonalTheme(prayerQuery.data, settings.seasonalMode);
  const ramadanInfo = prayerQuery.data ? buildRamadanInfo(prayerQuery.data) : null;

  useEffect(() => {
    if (!prayerQuery.data) {
      return;
    }

    storage.set('today_prayer_times', JSON.stringify(prayerQuery.data.prayers));
    void updatePrayerWidget(prayerQuery.data);
  }, [prayerQuery.data]);

  return (
    <Page>
      <SurfaceCard>
        <Image
          source={require('../../assets/branding/hero-ornament.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <SectionHeader
          title="نور الهدى"
          subtitle={`${formatFullDate(new Date())} · ${settings.location.label}`}
        />
        {seasonalTheme.specialGreeting ? <Text style={styles.greeting}>{seasonalTheme.specialGreeting}</Text> : null}
        <Text style={styles.heroText}>قرآن وصلاة وأذكار وإذاعات.</Text>
        <View style={styles.metricRow}>
          <MetricTile
            label="الوجهة الحالية"
            value={settings.location.label}
            hint=""
          />
          <MetricTile
            label="الوقت القادم"
            value={prayerQuery.data?.nextPrayer?.at ?? '--:--'}
            hint={nextPrayerLabel}
          />
        </View>
        <View style={styles.metricRow}>
          <MetricTile
            label="اتجاه القبلة"
            value={
              prayerQuery.data?.qiblaDegrees
                ? `${prayerQuery.data.qiblaDegrees.toFixed(1)}°`
                : '--'
            }
            hint=""
          />
          <MetricTile
            label="الإشارات المرجعية"
            value={`${bookmarks.length}`}
            hint=""
          />
        </View>
        <View style={styles.heroActionsRow}>
          <Link href="/features" asChild>
            <GhostButton label="مركز الميزات" onPress={() => undefined} />
          </Link>
          <Link href="/features/voice" asChild>
            <GhostButton label="الأوامر الصوتية" onPress={() => undefined} />
          </Link>
        </View>
      </SurfaceCard>

      {dailyQuery.isLoading ? (
        <SurfaceCard accent="blue">
          <ActivityIndicator color={theme.colors.goldLight} />
        </SurfaceCard>
      ) : dailyQuery.data ? (
        <>
          <SurfaceCard accent="emerald">
            <SectionHeader title="آية اليوم" subtitle={dailyQuery.data.ayah.reference} />
            <Text style={styles.ayahText}>{dailyQuery.data.ayah.text}</Text>
            <Link href={`/quran/${dailyQuery.data.ayah.surahId}`} asChild>
              <GhostButton label={`فتح ${dailyQuery.data.ayah.surahName}`} onPress={() => undefined} />
            </Link>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader title={dailyQuery.data.hadith.title} subtitle={dailyQuery.data.hadith.source} />
            <Text style={styles.bodyText}>{dailyQuery.data.hadith.text}</Text>
            <Link href={`/hadith/${dailyQuery.data.hadith.id}`} asChild>
              <GhostButton label="قراءة الشرح الكامل" onPress={() => undefined} />
            </Link>
          </SurfaceCard>
        </>
      ) : (
        <EmptyState title="لا يوجد محتوى يومي" message="حاول لاحقاً." />
      )}

      {seasonalTheme.id === 'ramadan' ? (
        <SurfaceCard accent="emerald">
          <SectionHeader title="برنامج رمضان" subtitle="بطاقة يومية خاصة بالشهر المبارك" />
          <Text style={styles.bodyText}>{ramadanInfo?.fastingMessage}</Text>
          <View style={styles.metricRow}>
            <MetricTile label="الهدف اليومي" value="جزء / 20 صفحة" hint="ابدأ بعد الفجر أو قبل التراويح" />
            <MetricTile label="تذكير الإفطار" value={ramadanInfo?.iftarTime ?? '--:--'} hint="موعد المغرب اليوم" />
          </View>
          <Text style={styles.bodyText}>{ramadanInfo?.suhoorTip}</Text>
          <Link href="/(tabs)/prayer" asChild>
            <GhostButton label="افتح الصلاة والتذكيرات" onPress={() => undefined} />
          </Link>
        </SurfaceCard>
      ) : null}

      {recentBookmarks.length ? (
        <SurfaceCard accent="gold">
          <SectionHeader title="متابعة القراءة" subtitle="آخر العلامات المحفوظة محلياً" />
          {recentBookmarks.map((bookmark) => (
            <Link href={`/quran/${bookmark.surahId}`} key={`${bookmark.surahId}-${bookmark.ayahNumber}`} asChild>
              <GhostButton
                label={`${bookmark.surahName} · الآية ${bookmark.ayahNumber}`}
                onPress={() => undefined}
              />
            </Link>
          ))}
        </SurfaceCard>
      ) : null}

      <SurfaceCard accent="blue">
        <SectionHeader
          title="الحساب"
          subtitle={initializing ? 'جارٍ التحقق من الجلسة...' : `الحالة: ${userLabel}`}
        />
        <Text style={styles.bodyText}>ادخل بحسابك أو استخدم التطبيق كضيف.</Text>
        {!user ? (
          <View style={styles.providerRow}>
            <Text style={styles.providerChip}>Email</Text>
            <Text style={styles.providerChip}>Guest</Text>
          </View>
        ) : null}
        {!user ? (
          <AuthWindow
            authLoading={authLoading}
            email={email}
            name={name}
            password={password}
            onChangeEmail={setEmail}
            onChangeName={setName}
            onChangePassword={setPassword}
            onRegister={() =>
              void handleAction(
                async () => {
                  await authActions.registerWithEmail(email, password, name);
                  await authActions.sendVerificationEmailToCurrentUser();
                },
                'تم إنشاء الحساب وأُرسلت رسالة التحقق إلى بريدك الإلكتروني.'
              )
            }
            onLogin={() =>
              void handleAction(
                () => authActions.loginWithEmail(email, password),
                'تم تسجيل الدخول.'
              )
            }
            onGuest={() =>
              void handleAction(
                () => authActions.continueAsGuest(),
                'تم فتح جلسة ضيف بنجاح.'
              )
            }
            onResetPassword={() =>
              void handleAction(
                () => authActions.sendPasswordResetLink(email),
                'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.'
              )
            }
            onMagicLink={() =>
              void handleAction(
                () => authActions.sendPasswordlessSignInLink(email),
                'تم إرسال رابط الدخول إلى بريدك الإلكتروني. افتحه على نفس الجهاز لإكمال الدخول.'
              )
            }
          />
        ) : (
          <View style={styles.formStack}>
            {needsVerification ? (
              <SurfaceCard accent="emerald">
                <SectionHeader title="تأكيد البريد الإلكتروني" subtitle={user?.email ?? ''} />
                <Text style={styles.helperText}>
                  بريدك غير مؤكد بعد. أرسل رسالة تحقق ثم اضغط تحديث الحالة بعد إتمام التحقق.
                </Text>
                <View style={styles.actionRow}>
                  <PrimaryButton
                    label="إرسال رسالة التحقق"
                    tone="emerald"
                    onPress={() =>
                      handleAction(
                        () => authActions.sendVerificationEmailToCurrentUser(),
                        'أُرسلت رسالة التحقق إلى بريدك الإلكتروني.'
                      )
                    }
                    disabled={authLoading}
                  />
                  <GhostButton
                    label="تحديث الحالة"
                    onPress={() =>
                      handleAction(
                        async () => {
                          await refresh();
                        },
                        'تم تحديث حالة البريد الإلكتروني.'
                      )
                    }
                    disabled={authLoading}
                  />
                </View>
              </SurfaceCard>
            ) : null}
            <Text style={styles.helperText}>
              {user.isAnonymous
                ? 'أنت الآن داخل جلسة ضيف. يمكنك لاحقاً إنشاء حساب دائم للاحتفاظ ببياناتك عبر الأجهزة.'
                : user.emailVerified
                  ? 'تم تأكيد بريدك الإلكتروني.'
                  : 'بريدك غير مؤكد بعد.'}
            </Text>
            <PrimaryButton
              label="حفظ الإعدادات الآن"
              tone="emerald"
              onPress={() =>
                handleAction(
                  async () => {
                    await syncUserSettings(user.uid, settings);
                  },
                  'تم حفظ الإعدادات.'
                )
              }
            />
            <GhostButton
              label="تسجيل الخروج"
              onPress={() => handleAction(() => authActions.logoutUser(), 'تم تسجيل الخروج.')}
            />
          </View>
        )}
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({
  heroText: {
    color: theme.colors.creamMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
  },
  greeting: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBlack,
    fontSize: 18,
    textAlign: 'right',
  },
  heroImage: {
    width: '100%',
    height: 148,
    borderRadius: 18,
    opacity: 0.92,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroActionsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  ayahText: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.arabic,
    fontSize: 24,
    lineHeight: 40,
    textAlign: 'right',
  },
  bodyText: {
    color: theme.colors.creamMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
  },
  formStack: {
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  providerChip: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  helperText: {
    color: theme.colors.creamFaint,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
  errorText: {
    color: '#F6A6A6',
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
});
