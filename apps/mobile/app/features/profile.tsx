import { StyleSheet, Text, View } from 'react-native';

import { Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { ACHIEVEMENTS } from '../../src/features/gamification/achievements';
import { useAuthUser } from '../../src/features/auth/service';
import { theme } from '../../src/lib/theme';
import { useAppStore } from '../../src/store/app-store';

export default function ProfileScreen() {
  const { user } = useAuthUser();
  const bookmarks = useAppStore((state) => state.bookmarks);
  const settings = useAppStore((state) => state.settings);

  return (
    <Page>
      <SectionHeader title="الملف الشخصي" subtitle={user ? (user.isAnonymous ? 'جلسة ضيف' : user.email ?? 'حساب نور الهدى') : 'غير مسجل'} />
      <SurfaceCard accent="emerald">
        <Text style={styles.title}>{user?.displayName ?? 'مستخدم نور الهدى'}</Text>
        <Text style={styles.body}>الموقع: {settings.location.label}</Text>
        <Text style={styles.body}>القارئ المفضل: {settings.reciter}</Text>
        <Text style={styles.body}>العلامات المرجعية: {bookmarks.length}</Text>
      </SurfaceCard>
      <SurfaceCard>
        <Text style={styles.title}>الأوسمة</Text>
        <View style={styles.badges}>
          {ACHIEVEMENTS.slice(0, 8).map((item) => (
            <View key={item.id} style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>{item.icon}</Text>
              <Text style={styles.badgeText}>{item.title_ar}</Text>
            </View>
          ))}
        </View>
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.goldLight, fontFamily: theme.fonts.display, fontSize: 26, textAlign: 'right' },
  body: { color: theme.colors.creamMuted, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 23, textAlign: 'right' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: 110, borderRadius: 18, backgroundColor: theme.colors.surfaceStrong, padding: 12, alignItems: 'center', gap: 8 },
  badgeIcon: { fontSize: 24 },
  badgeText: { color: theme.colors.cream, fontFamily: theme.fonts.bodyBold, fontSize: 12, textAlign: 'center' },
});
