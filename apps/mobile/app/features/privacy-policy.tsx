import { StyleSheet, Text } from 'react-native';

import { Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { theme } from '../../src/lib/theme';

export default function PrivacyPolicyScreen() {
  return (
    <Page>
      <SectionHeader title="سياسة الخصوصية" subtitle="كيف نتعامل مع بياناتك داخل نور الهدى" />
      <SurfaceCard accent="blue">
        <Text style={styles.body}>نحفظ بياناتك محلياً أولاً، وتتم المزامنة اختيارياً عند تسجيل الدخول. لا نشارك بياناتك الشخصية لأغراض تجارية، ويمكنك حذف بياناتك المحلية أو تصديرها من إعدادات الخصوصية.</Text>
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({ body: { color: theme.colors.cream, fontFamily: theme.fonts.body, fontSize: 15, lineHeight: 26, textAlign: 'right' } });
