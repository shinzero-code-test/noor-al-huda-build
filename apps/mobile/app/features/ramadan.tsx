import { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import { GhostButton, Page, PrimaryButton, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { buildLocalPrayerData, buildRamadanInfo } from '../../src/features/prayer/service';
import { islamicEvents } from '../../src/data/islamicHistory';
import { theme } from '../../src/lib/theme';
import { useAppStore } from '../../src/store/app-store';

export default function RamadanFeatureScreen() {
  const settings = useAppStore((state) => state.settings);
  const [tarawih, setTarawih] = useState(0);
  const [money, setMoney] = useState('0');
  const [gold, setGold] = useState('0');
  const [silver, setSilver] = useState('0');
  const prayerData = useMemo(() => buildRamadanInfo(buildLocalPrayerData(new Date(), settings.location, settings.calculationMethod)), [settings.calculationMethod, settings.location]);

  const zakat = useMemo(() => {
    const total = Number(money || 0) + Number(gold || 0) + Number(silver || 0);
    return Number.isFinite(total) ? (total * 0.025).toFixed(2) : '0.00';
  }, [gold, money, silver]);

  return (
    <Page>
      <SectionHeader title="رمضان والمناسبات" subtitle="سحور وإفطار وتراويح وزكاة ومواسم" />
      <SurfaceCard accent="emerald">
        <Text style={styles.title}>رمضان اليوم</Text>
        <Text style={styles.body}>{prayerData.fastingMessage}</Text>
        <Text style={styles.body}>السحور حتى: {prayerData.suhoorTip}</Text>
        <Text style={styles.body}>الإفطار: {prayerData.iftarTime}</Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.title}>عداد التراويح</Text>
        <Text style={styles.bigValue}>{tarawih}</Text>
        <View style={styles.row}>
          <GhostButton label="-2" onPress={() => setTarawih((value) => Math.max(0, value - 2))} />
          <PrimaryButton label="+2 ركعتين" onPress={() => setTarawih((value) => value + 2)} tone="emerald" />
        </View>
      </SurfaceCard>

      <SurfaceCard accent="blue">
        <Text style={styles.title}>حساب الزكاة</Text>
        <TextInput style={styles.input} value={money} onChangeText={setMoney} keyboardType="decimal-pad" placeholder="المال" placeholderTextColor={theme.colors.creamFaint} />
        <TextInput style={styles.input} value={gold} onChangeText={setGold} keyboardType="decimal-pad" placeholder="الذهب" placeholderTextColor={theme.colors.creamFaint} />
        <TextInput style={styles.input} value={silver} onChangeText={setSilver} keyboardType="decimal-pad" placeholder="الفضة" placeholderTextColor={theme.colors.creamFaint} />
        <Text style={styles.bigValue}>{zakat}</Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.title}>الحج والعمرة</Text>
        <Text style={styles.body}>1. الإحرام  2. الطواف  3. السعي  4. الوقوف بعرفة  5. المبيت والرمي  6. طواف الإفاضة.</Text>
        <GhostButton label="مشاهدة قناة المناسك" onPress={() => void Linking.openURL('https://www.youtube.com/watch?v=9Auq9mYxFEE')} />
      </SurfaceCard>

      <SurfaceCard accent="blue">
        <Text style={styles.title}>المواسم الإسلامية</Text>
        {islamicEvents.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <Text style={styles.eventDate}>{event.hijriDay}/{event.hijriMonth}</Text>
            <Text style={styles.body}>{event.title} — {event.description}</Text>
          </View>
        ))}
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.goldLight, fontFamily: theme.fonts.display, fontSize: 26, textAlign: 'right' },
  body: { color: theme.colors.cream, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 23, textAlign: 'right' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  bigValue: { color: theme.colors.goldLight, fontFamily: theme.fonts.bodyBlack, fontSize: 30, textAlign: 'right' },
  input: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.cream, padding: 14, fontFamily: theme.fonts.body },
  eventRow: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, gap: 6 },
  eventDate: { color: theme.colors.goldLight, fontFamily: theme.fonts.bodyBold, fontSize: 13, textAlign: 'right' },
});
