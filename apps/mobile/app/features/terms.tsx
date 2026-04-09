import { StyleSheet, Text } from 'react-native';

import { Page, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { theme } from '../../src/lib/theme';

export default function TermsScreen() {
  return (
    <Page>
      <SectionHeader title="شروط الاستخدام" subtitle="إرشادات استخدام التطبيق" />
      <SurfaceCard accent="blue">
        <Text style={styles.body}>يُستخدم التطبيق لأغراض تعبدية ومعرفية. المحتوى الذكي والإشعارات أدوات مساعدة ولا تغني عن سؤال أهل العلم عند الحاجة.</Text>
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({ body: { color: theme.colors.cream, fontFamily: theme.fonts.body, fontSize: 15, lineHeight: 26, textAlign: 'right' } });
