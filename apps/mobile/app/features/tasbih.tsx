import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { theme } from '../../src/lib/theme';

export default function TasbihScreen() {
  const [count, setCount] = useState(0);
  const target = 33;

  async function increment() {
    const next = count + 1;
    setCount(next);
    if (next >= target) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.selectionAsync();
    }
  }

  return (
    <Page>
      <SectionHeader title="المسبحة الذكية" subtitle="اهتزاز عند إتمام العدد" />
      <SurfaceCard accent="emerald">
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.label}>الهدف: {target}</Text>
        <Pressable style={styles.circle} onPress={() => void increment()}>
          <Text style={styles.circleText}>سبّح</Text>
        </Pressable>
        <Pressable style={styles.reset} onPress={() => setCount(0)}>
          <Text style={styles.resetText}>إعادة</Text>
        </Pressable>
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({
  count: { color: theme.colors.goldLight, fontFamily: theme.fonts.bodyBlack, fontSize: 48, textAlign: 'center' },
  label: { color: theme.colors.creamMuted, fontFamily: theme.fonts.body, fontSize: 16, textAlign: 'center' },
  circle: { alignSelf: 'center', width: 180, height: 180, borderRadius: 90, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center' },
  circleText: { color: '#fff', fontFamily: theme.fonts.bodyBlack, fontSize: 22 },
  reset: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  resetText: { color: theme.colors.goldLight, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
});
