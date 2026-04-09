import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { GhostButton, Page, PrimaryButton, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { fetchPrayerTimes } from '../../src/features/prayer/service';
import { prayerLabels } from '../../src/lib/formatting';
import {
  cancelScheduledNotificationsAsync,
  ensureLocalNotificationsPermissionAsync,
  registerForPushNotificationsAsync,
  scheduleDailyPrayerNotifications,
  schedulePrayerReminderAsync,
} from '../../src/lib/notifications';
import { theme } from '../../src/lib/theme';
import { useAppStore } from '../../src/store/app-store';

const methods = [
  { key: 'ummAlQura', label: 'أم القرى' },
  { key: 'egyptian', label: 'الهيئة المصرية' },
  { key: 'karachi', label: 'كراتشي' },
];

export default function PrayerScreen() {
  const settings = useAppStore((state) => state.settings);
  const setLocation = useAppStore((state) => state.setLocation);
  const setCalculationMethod = useAppStore((state) => state.setCalculationMethod);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const [locating, setLocating] = useState(false);

  const prayerQuery = useQuery({
    queryKey: ['prayer-screen', settings.location, settings.calculationMethod],
    queryFn: () => fetchPrayerTimes(settings.location, settings.calculationMethod),
  });

  async function refreshLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('تم رفض إذن الموقع.');
      }

      const current = await Location.getCurrentPositionAsync({});
      const places = await Location.reverseGeocodeAsync(current.coords);
      const first = places[0];
      setLocation({
        label: first?.city || first?.region || 'موقعك الحالي',
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (error) {
      Alert.alert('تعذر تحديث الموقع', error instanceof Error ? error.message : 'حاول مرة أخرى.');
    } finally {
      setLocating(false);
    }
  }

  async function enableNotifications() {
    const granted = await ensureLocalNotificationsPermissionAsync();
    setNotificationsEnabled(granted);
    if (granted) {
      void registerForPushNotificationsAsync().catch(() => null);
    }
    Alert.alert('الإشعارات', granted ? 'تم تفعيل الإشعارات المحلية.' : 'لم يتم منح الإذن بعد.');
  }

  async function scheduleNextPrayerReminder() {
    if (!prayerQuery.data?.nextPrayer) {
      Alert.alert('لا يوجد تنبيه', 'لا توجد صلاة قادمة متاحة الآن.');
      return;
    }

    const notificationsEnabled = await ensureLocalNotificationsPermissionAsync();
    setNotificationsEnabled(notificationsEnabled);

    if (!notificationsEnabled) {
      Alert.alert('الإشعارات غير متاحة', 'فعّل إذن الإشعارات أولاً حتى نستطيع جدولة التذكير.');
      return;
    }

    const nextDate = new Date(Date.now() + prayerQuery.data.nextPrayer.minutesUntil * 60_000);
    await schedulePrayerReminderAsync(
      prayerLabels[prayerQuery.data.nextPrayer.name],
      `اقترب وقت ${prayerLabels[prayerQuery.data.nextPrayer.name]} في ${settings.location.label}.`,
      nextDate
    );

    Alert.alert(
      'تمت الجدولة',
      `سيصلك تذكير قبل/عند ${prayerLabels[prayerQuery.data.nextPrayer.name]} تقريباً عند ${prayerQuery.data.nextPrayer.at}.`
    );
  }

  async function clearReminders() {
    await cancelScheduledNotificationsAsync();
    Alert.alert('تم المسح', 'أُزيلت جميع التذكيرات المحلية المجدولة.');
  }

  async function scheduleFullDay() {
    const notificationsEnabled = await ensureLocalNotificationsPermissionAsync();
    setNotificationsEnabled(notificationsEnabled);
    if (!notificationsEnabled) {
      Alert.alert('الإشعارات غير متاحة', 'يلزم منح إذن الإشعارات أولاً.');
      return;
    }

    await cancelScheduledNotificationsAsync();
    await scheduleDailyPrayerNotifications(settings.location, settings.calculationMethod, { includeAzanLabel: true });
    Alert.alert('تمت الجدولة', 'تمت إضافة تذكيرات اليوم كاملة مع عناوين الأذان ومواقيت الصلاة.');
  }

  return (
    <Page>
      <SectionHeader title="الصلاة والقبلة" subtitle={settings.location.label} />

      <SurfaceCard accent="emerald">
        <Text style={styles.highlightLabel}>طريقة الحساب</Text>
        <Text style={styles.highlightValue}>{methods.find((item) => item.key === settings.calculationMethod)?.label}</Text>
        <View style={styles.methodRow}>
          {methods.map((method) => (
            <GhostButton key={method.key} label={method.label} onPress={() => setCalculationMethod(method.key)} />
          ))}
        </View>
        <View style={styles.actionRow}>
          <PrimaryButton label={locating ? 'جاري التحديد...' : 'تحديث الموقع'} onPress={refreshLocation} tone="emerald" disabled={locating} />
          <GhostButton label="تفعيل الإشعارات" onPress={enableNotifications} />
          <GhostButton label="إعادة التحميل" onPress={() => void prayerQuery.refetch()} />
        </View>
      </SurfaceCard>

      {prayerQuery.isLoading ? (
        <SurfaceCard>
          <ActivityIndicator color={theme.colors.goldLight} />
        </SurfaceCard>
      ) : prayerQuery.data ? (
        <SurfaceCard>
          <SectionHeader
            title="مواقيت اليوم"
            subtitle={
              prayerQuery.data.nextPrayer
                ? `القادم: ${prayerLabels[prayerQuery.data.nextPrayer.name]} · ${prayerQuery.data.nextPrayer.at}`
                : 'اكتمل يومك'
            }
          />
          <View style={styles.actionRow}>
            <PrimaryButton
              label="أذان الصلاة القادمة"
              tone="emerald"
              disabled={!prayerQuery.data.nextPrayer}
              onPress={() => void scheduleNextPrayerReminder()}
            />
            <GhostButton label="جدولة الأذان لليوم" onPress={() => void scheduleFullDay()} />
            <GhostButton label="إلغاء التذكيرات" onPress={() => void clearReminders()} />
          </View>
          {Object.entries(prayerQuery.data.prayers).map(([key, value]) => (
            <View style={styles.prayerRow} key={key}>
              <Text style={styles.prayerTime}>{value}</Text>
              <Text style={styles.prayerName}>{prayerLabels[key as keyof typeof prayerLabels]}</Text>
            </View>
          ))}
          <View style={styles.qiblaBox}>
            <Text style={styles.qiblaLabel}>اتجاه القبلة</Text>
            <Text style={styles.qiblaValue}>{prayerQuery.data.qiblaDegrees.toFixed(1)}°</Text>
          </View>
        </SurfaceCard>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  highlightLabel: {
    color: theme.colors.creamFaint,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    textAlign: 'right',
  },
  highlightValue: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    textAlign: 'right',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  prayerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  prayerName: {
    color: theme.colors.cream,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
  },
  prayerTime: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBlack,
    fontSize: 15,
  },
  qiblaBox: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(42,157,92,0.12)',
    gap: 6,
  },
  qiblaLabel: {
    color: theme.colors.creamFaint,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    textAlign: 'right',
  },
  qiblaValue: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBlack,
    fontSize: 28,
    textAlign: 'right',
  },
});
