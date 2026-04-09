import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GhostButton, Page, PrimaryButton, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { computePrayerDateMap, fetchPrayerTimes } from '../../src/features/prayer/service';
import { prayerLabels } from '../../src/lib/formatting';
import {
  cancelScheduledNotificationsAsync,
  ensureLocalNotificationsPermissionAsync,
  registerForPushNotificationsAsync,
  scheduleHourlyDhikrNotifications,
  scheduleMorningEveningAzkarNotifications,
  scheduleDailyPrayerNotifications,
  schedulePrayerReminderAsync,
} from '../../src/lib/notifications';
import { fetchAzkarCollection } from '../../src/features/azkar/service';
import { theme } from '../../src/lib/theme';
import { useAppStore } from '../../src/store/app-store';
import { type PrayerLogEntry, type PrayerName } from '../../src/types/domain';
import { storage } from '../../src/lib/mmkv';

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
  const [prayerLog, setPrayerLog] = useState<PrayerLogEntry[]>(() => {
    try {
      return JSON.parse(storage.getString('prayer_log') ?? '[]') as PrayerLogEntry[];
    } catch {
      return [];
    }
  });

  const prayerQuery = useQuery({
    queryKey: ['prayer-screen', settings.location, settings.calculationMethod],
    queryFn: () => fetchPrayerTimes(settings.location, settings.calculationMethod),
  });

  const monthlySchedule = useMemo(() => {
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const map = computePrayerDateMap(date, settings.location, settings.calculationMethod);
      return {
        label: new Intl.DateTimeFormat('ar-EG', { month: 'short', day: 'numeric' }).format(date),
        fajr: map.fajr,
        maghrib: map.maghrib,
      };
    });
  }, [settings.calculationMethod, settings.location]);

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
    await scheduleDailyPrayerNotifications(settings.location, settings.calculationMethod, {
      includeAzanLabel: true,
      adhanSound: settings.adhanSound,
    });
    if (settings.morningEveningReminders) {
      await scheduleMorningEveningAzkarNotifications();
    }
    const hourlyEntries = await fetchAzkarCollection('morning');
    await scheduleHourlyDhikrNotifications(
      hourlyEntries.map((item) => ({ id: item.id, text: item.text })),
      settings.hourlyReminderMinutes ?? 60,
      10
    );
    Alert.alert('تمت الجدولة', 'تمت إضافة الأذان وتذكيرات الصباح والمساء وورد الساعة لليوم.');
  }

  function markPrayer(prayer: PrayerName, status: PrayerLogEntry['status']) {
    const next = [{ prayer, status, date: new Date().toISOString() }, ...prayerLog].slice(0, 50);
    setPrayerLog(next);
    storage.set('prayer_log', JSON.stringify(next));
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
          <View style={styles.actionRow}>
            <GhostButton label="تسجيل فائتة الفجر" onPress={() => markPrayer('fajr', 'missed')} />
            <GhostButton label="تم القضاء" onPress={() => markPrayer('fajr', 'made_up')} />
          </View>
          <View style={styles.qiblaBox}>
            <Text style={styles.qiblaLabel}>اتجاه القبلة</Text>
            <Text style={styles.qiblaValue}>{prayerQuery.data.qiblaDegrees.toFixed(1)}°</Text>
          </View>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <SectionHeader title="مواقيت الشهر" subtitle="الفجر والمغرب لثلاثين يوماً" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scheduleRow}>
          {monthlySchedule.map((item) => (
            <View key={item.label} style={styles.scheduleCard}>
              <Text style={styles.scheduleDate}>{item.label}</Text>
              <Text style={styles.scheduleTime}>الفجر: {item.fajr.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.scheduleTime}>المغرب: {item.maghrib.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          ))}
        </ScrollView>
      </SurfaceCard>

      {prayerLog.length ? (
        <SurfaceCard accent="blue">
          <SectionHeader title="سجل الفوائت والقضاء" subtitle="آخر السجلات" />
          {prayerLog.slice(0, 8).map((entry, index) => (
            <View key={`${entry.date}-${index}`} style={styles.logRow}>
              <Text style={styles.logDate}>{new Date(entry.date).toLocaleDateString('ar-EG')}</Text>
              <Text style={styles.logState}>{entry.status === 'missed' ? 'فائتة' : entry.status === 'made_up' ? 'تم القضاء' : 'مؤداة'}</Text>
              <Text style={styles.logPrayer}>{prayerLabels[entry.prayer]}</Text>
            </View>
          ))}
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
  scheduleRow: {
    gap: 12,
  },
  scheduleCard: {
    width: 190,
    borderRadius: 18,
    padding: 14,
    backgroundColor: theme.colors.surfaceStrong,
    gap: 8,
  },
  scheduleDate: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    textAlign: 'right',
  },
  scheduleTime: {
    color: theme.colors.cream,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    textAlign: 'right',
  },
  logRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logPrayer: {
    color: theme.colors.cream,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  logState: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  logDate: {
    color: theme.colors.creamFaint,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
});
