import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { GhostButton, Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { useAuthUser } from '../../src/features/auth/service';
import { fetchDailyContent } from '../../src/features/daily/service';
import { fetchHadithCollections } from '../../src/features/hadith/service';
import { fetchAzkarCollection } from '../../src/features/azkar/service';
import { fetchSurahDetail, fetchSurahList } from '../../src/features/quran/service';
import { theme } from '../../src/lib/theme';
import { useAppStore } from '../../src/store/app-store';

const calculationMethods = {
  ummAlQura: 'أم القرى',
  egyptian: 'الهيئة المصرية',
  karachi: 'كراتشي',
} as const;

export default function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const lastReadSurahId = useAppStore((state) => state.lastReadSurahId);
  const setCalculationMethod = useAppStore((state) => state.setCalculationMethod);
  const setReciter = useAppStore((state) => state.setReciter);
  const setSeasonalMode = useAppStore((state) => state.setSeasonalMode);
  const setHourlyReminderMinutes = useAppStore((state) => state.setHourlyReminderMinutes);
  const setMorningEveningReminders = useAppStore((state) => state.setMorningEveningReminders);
  const setAdhanSound = useAppStore((state) => state.setAdhanSound);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const { user } = useAuthUser();

  async function cacheCoreContent() {
    try {
      const surahs = await fetchSurahList();
      await Promise.all([
        fetchDailyContent(),
        fetchAzkarCollection('morning'),
        fetchAzkarCollection('evening'),
        fetchAzkarCollection('after-prayer'),
        fetchHadithCollections(),
        ...surahs.slice(0, 10).map((item) => fetchSurahDetail(item.id)),
      ]);
      Alert.alert('تم الحفظ', 'تم تنزيل المحتوى الأساسي للاستخدام دون اتصال.');
    } catch (error) {
      Alert.alert('تعذر التنزيل', error instanceof Error ? error.message : 'حدث خطأ أثناء تنزيل المحتوى.');
    }
  }

  return (
    <Page>
      <SectionHeader title="الإعدادات" subtitle="تخصيص التجربة اليومية" />

      <SurfaceCard accent="emerald">
        <SectionHeader title="الملف الشخصي" subtitle={user ? (user.isAnonymous ? 'جلسة ضيف' : user.email ?? 'حساب موثق') : 'غير مسجل'} />
        <Text style={styles.bodyText}>الموقع: {settings.location.label}</Text>
        <Text style={styles.bodyText}>طريقة الحساب: {calculationMethods[settings.calculationMethod as keyof typeof calculationMethods] ?? settings.calculationMethod}</Text>
        <Text style={styles.bodyText}>القارئ المختار: {settings.reciter}</Text>
        <Text style={styles.bodyText}>الإشعارات: {settings.notificationsEnabled ? 'مفعلة' : 'غير مفعلة'}</Text>
        <Text style={styles.bodyText}>الإشارات المرجعية: {bookmarks.length}</Text>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader title="إعدادات الاستخدام" subtitle="الصلاة والتنبيهات والصوت" />
        <View style={styles.quickLinks}>
          <GhostButton label={`الحساب: ${calculationMethods.ummAlQura}`} onPress={() => setCalculationMethod('ummAlQura')} />
          <GhostButton label={`الحساب: ${calculationMethods.egyptian}`} onPress={() => setCalculationMethod('egyptian')} />
          <GhostButton label={`الحساب: ${calculationMethods.karachi}`} onPress={() => setCalculationMethod('karachi')} />
          <GhostButton
            label={settings.notificationsEnabled ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'}
            onPress={() => setNotificationsEnabled(!settings.notificationsEnabled)}
          />
          <GhostButton label="القارئ: مشاري العفاسي" onPress={() => setReciter('مشاري العفاسي')} />
          <GhostButton label="القارئ: السديس" onPress={() => setReciter('عبدالرحمن السديس')} />
          <GhostButton label={settings.seasonalMode === 'ramadan' ? 'رمضان: مفعّل' : 'رمضان: تلقائي'} onPress={() => setSeasonalMode(settings.seasonalMode === 'ramadan' ? 'auto' : 'ramadan')} />
          <GhostButton label={`ورد الساعة: ${settings.hourlyReminderMinutes ?? 60} دقيقة`} onPress={() => setHourlyReminderMinutes(settings.hourlyReminderMinutes === 60 ? 120 : 60)} />
          <GhostButton label={settings.morningEveningReminders ? 'أذكار الصباح/المساء: مفعلة' : 'أذكار الصباح/المساء: متوقفة'} onPress={() => setMorningEveningReminders(!settings.morningEveningReminders)} />
          <GhostButton label={settings.adhanSound === 'adhan' ? 'صوت الإشعار: أذان' : 'صوت الإشعار: افتراضي'} onPress={() => setAdhanSound(settings.adhanSound === 'adhan' ? 'default' : 'adhan')} />
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader title="التطبيق" subtitle="معلومات عامة" />
        <Text style={styles.bodyText}>الإصدار: {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <Text style={styles.bodyText}>آخر سورة: {lastReadSurahId ?? 'لا يوجد'}</Text>
        <GhostButton label="تنزيل المحتوى الأساسي دون إنترنت" onPress={() => void cacheCoreContent()} />
        {lastReadSurahId ? (
          <Link href={`/quran/${lastReadSurahId}`} asChild>
            <GhostButton label="فتح آخر سورة" onPress={() => undefined} />
          </Link>
        ) : null}
        <Link href="/features" asChild>
          <GhostButton label="فتح مركز الميزات المتقدمة" onPress={() => undefined} />
        </Link>
      </SurfaceCard>

      <SurfaceCard accent="blue">
        <SectionHeader title="روابط سريعة" subtitle="اختصارات مباشرة للميزات الموسعة" />
        <View style={styles.quickLinks}>
          <Link href="/features/search" asChild>
            <GhostButton label="البحث الدلالي" onPress={() => undefined} />
          </Link>
          <Link href="/features/dua" asChild>
            <GhostButton label="مولد الدعاء" onPress={() => undefined} />
          </Link>
          <Link href="/features/hadith" asChild>
            <GhostButton label="مكتبة الحديث" onPress={() => undefined} />
          </Link>
          <Link href="/features/companion" asChild>
            <GhostButton label="الرفيق اليومي" onPress={() => undefined} />
          </Link>
          <Link href="/features/calendar" asChild>
            <GhostButton label="التقويم الهجري" onPress={() => undefined} />
          </Link>
          <Link href="/features/seerah" asChild>
            <GhostButton label="السيرة والقصص" onPress={() => undefined} />
          </Link>
          <Link href="/features/knowledge" asChild>
            <GhostButton label="المعرفة الإسلامية" onPress={() => undefined} />
          </Link>
          <Link href="/features/ramadan" asChild>
            <GhostButton label="رمضان والمواسم" onPress={() => undefined} />
          </Link>
          <Link href="/features/qibla" asChild>
            <GhostButton label="القبلة" onPress={() => undefined} />
          </Link>
          <Link href="/features/halal" asChild>
            <GhostButton label="ماسح الحلال" onPress={() => undefined} />
          </Link>
          <Link href="/features/tracker" asChild>
            <GhostButton label="متابعة العبادة" onPress={() => undefined} />
          </Link>
          <Link href="/features/khatm" asChild>
            <GhostButton label="الختمة الجماعية" onPress={() => undefined} />
          </Link>
          <Link href="/features/kids" asChild>
            <GhostButton label="وضع الأطفال" onPress={() => undefined} />
          </Link>
          <Link href="/features/tasbih" asChild>
            <GhostButton label="المسبحة الذكية" onPress={() => undefined} />
          </Link>
          <Link href="/features/ruya" asChild>
            <GhostButton label="يومية الرؤى" onPress={() => undefined} />
          </Link>
          <Link href="/features/share" asChild>
            <GhostButton label="بطاقات المشاركة" onPress={() => undefined} />
          </Link>
          <Link href="/features/assistant" asChild>
            <GhostButton label="المساعد الإسلامي" onPress={() => undefined} />
          </Link>
          <Link href="/features/quiz" asChild>
            <GhostButton label="الاختبارات" onPress={() => undefined} />
          </Link>
          <Link href="/features/mood" asChild>
            <GhostButton label="تحليل المزاج" onPress={() => undefined} />
          </Link>
          <Link href="/features/privacy" asChild>
            <GhostButton label="الخصوصية" onPress={() => undefined} />
          </Link>
          <Link href="/features/profile" asChild>
            <GhostButton label="الملف الشخصي" onPress={() => undefined} />
          </Link>
          <Link href="/features/privacy-policy" asChild>
            <GhostButton label="سياسة الخصوصية" onPress={() => undefined} />
          </Link>
          <Link href="/features/terms" asChild>
            <GhostButton label="شروط الاستخدام" onPress={() => undefined} />
          </Link>
          <Link href="/features/about" asChild>
            <GhostButton label="من نحن" onPress={() => undefined} />
          </Link>
          <Link href="/features/voice" asChild>
            <GhostButton label="الأوامر الصوتية" onPress={() => undefined} />
          </Link>
        </View>
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: theme.colors.creamMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'right',
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
});
