import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Page, SectionHeader } from '../../src/components/ui';
import { theme } from '../../src/lib/theme';

const cards = [
  { href: '/features/tajweed', title: 'مدرب التجويد', subtitle: 'تحليل تلاوة بالذكاء الاصطناعي' },
  { href: '/features/search', title: 'البحث الدلالي', subtitle: 'اكتشف الآيات بالمعنى' },
  { href: '/features/dua', title: 'مولد الدعاء', subtitle: 'دعاء شخصي مع مصادر' },
  { href: '/features/hadith', title: 'مكتبة الحديث', subtitle: 'كتب ومجموعات وبحث وتمرير مستمر' },
  { href: '/features/companion', title: 'الرفيق اليومي', subtitle: 'تأمل روحاني مخصص لهذا اليوم' },
  { href: '/features/calendar', title: 'التقويم الهجري', subtitle: 'التاريخ الهجري والمناسبات الإسلامية' },
  { href: '/features/ramadan', title: 'رمضان والمواسم', subtitle: 'سحور وإفطار وتراويح وزكاة ومناسبات' },
  { href: '/features/seerah', title: 'السيرة والقصص', subtitle: 'سيرة النبي ﷺ وقصص الأنبياء' },
  { href: '/features/knowledge', title: 'المعرفة الإسلامية', subtitle: 'أسماء الله، الرقية، الفقه، الكتب، والبث' },
  { href: '/features/assistant', title: 'المساعد الإسلامي', subtitle: 'أسئلة شرعية بإسناد ومصادر' },
  { href: '/features/quiz', title: 'الاختبارات', subtitle: 'أسئلة ومسابقات معرفية' },
  { href: '/features/tasbih', title: 'المسبحة الذكية', subtitle: 'عداد واهتزاز عند الإتمام' },
  { href: '/features/profile', title: 'الملف الشخصي', subtitle: 'الحساب والإنجازات والإعدادات' },
  { href: '/features/privacy-policy', title: 'سياسة الخصوصية', subtitle: 'بنود الخصوصية وحماية البيانات' },
  { href: '/features/terms', title: 'شروط الاستخدام', subtitle: 'ضوابط استخدام التطبيق' },
  { href: '/features/about', title: 'من نحن', subtitle: 'نبذة عن مشروع نور الهدى' },
  { href: '/features/qibla', title: 'قبلة معززة', subtitle: 'بوصلة AR واتجاه مباشر' },
  { href: '/features/halal', title: 'ماسح الحلال', subtitle: 'تحقق من مكونات المنتجات' },
  { href: '/features/tracker', title: 'متابعة العبادة', subtitle: 'تتبع الصيام والورد والصدقة' },
  { href: '/features/ruya', title: 'يومية الرؤى', subtitle: 'سجل خاص وتأمل إسلامي' },
  { href: '/features/khatm', title: 'الختمة الجماعية', subtitle: 'تعاون حيّ لإتمام القرآن' },
  { href: '/features/kids', title: 'وضع الأطفال', subtitle: 'تعلم آمن وممتع للصغار' },
  { href: '/features/share', title: 'بطاقات المشاركة', subtitle: 'تصميمات جاهزة للنشر' },
  { href: '/features/privacy', title: 'الخصوصية', subtitle: 'تحكم كامل في نمط بياناتك' },
  { href: '/features/voice', title: 'الأوامر الصوتية', subtitle: 'تنقل وتحكم بالعربية' },
];

export default function FeaturesHubScreen() {
  return (
    <Page>
      <SectionHeader title="مركز الميزات" subtitle="الخصائص المتقدمة في نور الهدى" />
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {cards.map((card) => (
          <Link href={card.href as never} key={card.href} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.subtitle}>{card.subtitle}</Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.22)',
    backgroundColor: theme.colors.surface,
    gap: 12,
    ...theme.shadow.card,
  },
  title: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.display,
    fontSize: 24,
    textAlign: 'right',
  },
  subtitle: {
    color: theme.colors.creamMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
});
