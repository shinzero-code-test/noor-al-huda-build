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
  TextField,
} from '../../src/components/ui';
import { fetchDailyContent } from '../../src/features/daily/service';
import {
  authActions,
  mapFirebaseAuthError,
  useAuthUser,
  useGoogleSignIn,
} from '../../src/features/auth/service';
import { fetchPrayerTimes } from '../../src/features/prayer/service';
import { formatFullDate, formatMinutes, prayerLabels } from '../../src/lib/formatting';
import { syncUserSettings } from '../../src/lib/firebase';
import { theme } from '../../src/lib/theme';
import { useSeasonalTheme } from '../../src/shared/hooks/useSeasonalTheme';
import { storage } from '../../src/lib/mmkv';
import { useAppStore } from '../../src/store/app-store';

export default function HomeScreen() {
  const settings = useAppStore((state) => state.settings);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const syncMessage = useAppStore((state) => state.syncMessage);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const { initializing, user, refresh } = useAuthUser();
  const googleSignIn = useGoogleSignIn();

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
  const seasonalTheme = useSeasonalTheme(prayerQuery.data);

  useEffect(() => {
    if (!prayerQuery.data) {
      return;
    }

    storage.set('today_prayer_times', JSON.stringify(prayerQuery.data.prayers));
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
        <Text style={styles.heroText}>
          مركز يومي للقرآن، الصلاة، الأذكار، والإذاعات الإسلامية مع دعم Offline وتخزين ذكي.
        </Text>
        <Text style={styles.syncLine}>
          حالة المزامنة: {syncStatus === 'synced' ? 'متصلة' : syncStatus === 'syncing' ? 'جارٍ التحديث' : syncStatus === 'error' ? 'بحاجة لتدخل' : 'محلية'}
          {syncMessage ? ` · ${syncMessage}` : ''}
        </Text>
        <View style={styles.metricRow}>
          <MetricTile
            label="الوجهة الحالية"
            value={settings.location.label}
            hint={prayerQuery.data?.source === 'worker' ? 'عبر Cloudflare Worker' : 'حساب محلي'}
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
            hint="من موقعك الحالي"
          />
          <MetricTile
            label="الإشارات المرجعية"
            value={`${bookmarks.length}`}
            hint="متزامنة محلياً وFirebase"
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
        <EmptyState title="لا يوجد محتوى يومي" message="سيظهر حديث وآية اليوم بعد أول مزامنة ناجحة." />
      )}

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
          title="الحساب والمزامنة"
          subtitle={initializing ? 'جارٍ التحقق من الجلسة...' : `الحالة: ${userLabel}`}
        />
        <Text style={styles.bodyText}>
          التطبيق يزامن الإعدادات، آخر موضع قراءة، والإشارات المرجعية إلى Firebase عند تسجيل الدخول.
        </Text>
        {!user ? (
          <View style={styles.providerRow}>
            <Text style={styles.providerChip}>Email</Text>
            <Text style={styles.providerChip}>{googleSignIn.enabled ? 'Google' : 'Google قريباً'}</Text>
            <Text style={styles.providerChip}>Guest</Text>
          </View>
        ) : null}
        {!user && googleSignIn.enabled ? (
          <PrimaryButton
            label={
              googleSignIn.stage === 'opening'
                ? 'جارٍ فتح Google...'
                : googleSignIn.stage === 'verifying'
                  ? 'جارٍ إتمام الربط...'
                  : 'متابعة باستخدام Google'
            }
            tone="emerald"
            disabled={!googleSignIn.canStart}
            onPress={() => {
              void googleSignIn.signIn().catch((error) => {
                Alert.alert(
                  'تعذر تسجيل الدخول',
                  error instanceof Error ? error.message : 'حاول مرة أخرى.'
                );
              });
            }}
          />
        ) : null}
        {!user && googleSignIn.info ? (
          <Text style={styles.helperText}>{googleSignIn.info}</Text>
        ) : null}
        {!user && googleSignIn.error ? (
          <Text style={styles.errorText}>{googleSignIn.error}</Text>
        ) : null}
        {!user ? (
          <View style={styles.formStack}>
            <TextField value={name} onChangeText={setName} placeholder="الاسم (اختياري)" />
            <TextField value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" />
            <TextField
              value={password}
              onChangeText={setPassword}
              placeholder="كلمة المرور"
              secureTextEntry
            />
            <View style={styles.actionRow}>
              <PrimaryButton
                label={authLoading ? '...' : 'إنشاء حساب'}
                onPress={() =>
                  handleAction(
                    async () => {
                      await authActions.registerWithEmail(email, password, name);
                      await authActions.sendVerificationEmailToCurrentUser();
                    },
                    'تم إنشاء الحساب وأُرسلت رسالة التحقق إلى بريدك الإلكتروني.'
                  )
                }
                disabled={authLoading}
              />
              <GhostButton
                label="تسجيل الدخول"
                onPress={() =>
                  handleAction(
                    () => authActions.loginWithEmail(email, password),
                    'تم تسجيل الدخول.'
                  )
                }
                disabled={authLoading}
              />
              <GhostButton
                label="الدخول كضيف"
                onPress={() =>
                  handleAction(
                    () => authActions.continueAsGuest(),
                    'تم فتح جلسة ضيف بنجاح.'
                  )
                }
                disabled={authLoading}
              />
            </View>
            <GhostButton
              label="إرسال رابط إعادة تعيين كلمة المرور"
              onPress={() =>
                handleAction(
                  () => authActions.sendPasswordResetLink(email),
                  'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.'
                )
              }
              disabled={authLoading || !email.trim()}
            />
            <GhostButton
              label="إرسال رابط دخول بدون كلمة مرور"
              onPress={() =>
                handleAction(
                  () => authActions.sendPasswordlessSignInLink(email),
                  'تم إرسال رابط الدخول إلى بريدك الإلكتروني. افتحه على نفس الجهاز لإكمال الدخول.'
                )
              }
              disabled={authLoading || !email.trim()}
            />
            {!googleSignIn.enabled ? (
              <Text style={styles.helperText}>
                {googleSignIn.info ?? 'Google Sign-In غير متاح حالياً على هذا الإصدار.'}
              </Text>
            ) : null}
            <Text style={styles.helperText}>
              يمكن أيضاً الدخول برابط بريدي بدون كلمة مرور. سيُكمل التطبيق الدخول تلقائياً عند فتح الرابط من البريد.
            </Text>
            {googleSignIn.enabled && !googleSignIn.ready ? (
              <Text style={styles.helperText}>يتم تجهيز جلسة Google الآمنة لهذا الجهاز...</Text>
            ) : null}
          </View>
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
                  ? 'تم تأكيد بريدك الإلكتروني وربط بياناتك مع Firebase.'
                  : 'حسابك مرتبط بـ Firebase لكن بريدك الإلكتروني لم يُؤكد بعد.'}
            </Text>
            <PrimaryButton
              label="مزامنة الإعدادات الآن"
              tone="emerald"
              onPress={() =>
                handleAction(
                  async () => {
                    await syncUserSettings(user.uid, settings);
                  },
                  'تمت مزامنة بياناتك إلى Firebase.'
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
  syncLine: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
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
