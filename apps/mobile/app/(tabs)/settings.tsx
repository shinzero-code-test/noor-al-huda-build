import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GhostButton, Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { useAuthUser } from '../../src/features/auth/service';
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
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const { user } = useAuthUser();

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
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader title="التطبيق" subtitle="معلومات عامة" />
        <Text style={styles.bodyText}>الإصدار: {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <Text style={styles.bodyText}>آخر سورة: {lastReadSurahId ?? 'لا يوجد'}</Text>
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
          <Link href="/features/ruya" asChild>
            <GhostButton label="يومية الرؤى" onPress={() => undefined} />
          </Link>
          <Link href="/features/share" asChild>
            <GhostButton label="بطاقات المشاركة" onPress={() => undefined} />
          </Link>
          <Link href="/features/privacy" asChild>
            <GhostButton label="الخصوصية" onPress={() => undefined} />
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
