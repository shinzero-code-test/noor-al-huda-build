import { StyleSheet, Text, View } from 'react-native';

import { Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { theme } from '../../src/lib/theme';

export default function AboutScreen() {
  return (
    <Page>
      <SectionHeader title="من نحن" subtitle="عن مشروع نور الهدى" />
      <SurfaceCard accent="emerald">
        <Text style={styles.title}>نور الهدى</Text>
        <Text style={styles.body}>منصة إسلامية عربية تهدف إلى جمع القرآن والحديث والأذكار والأدوات اليومية في تجربة واحدة هادئة وعملية.</Text>
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({ title: { color: theme.colors.goldLight, fontFamily: theme.fonts.display, fontSize: 28, textAlign: 'right' }, body: { color: theme.colors.cream, fontFamily: theme.fonts.body, fontSize: 15, lineHeight: 26, textAlign: 'right' } });
