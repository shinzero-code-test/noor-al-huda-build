import { Image, StyleSheet, Text, View } from 'react-native';

import { GhostButton, PrimaryButton, SurfaceCard, TextField } from '../../../components/ui';
import { theme } from '../../../lib/theme';

type AuthWindowProps = {
  authLoading: boolean;
  email: string;
  name: string;
  password: string;
  onChangeEmail: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangePassword: (value: string) => void;
  onRegister: () => void;
  onLogin: () => void;
  onGuest: () => void;
  onResetPassword: () => void;
  onMagicLink: () => void;
};

export function AuthWindow({
  authLoading,
  email,
  name,
  password,
  onChangeEmail,
  onChangeName,
  onChangePassword,
  onRegister,
  onLogin,
  onGuest,
  onResetPassword,
  onMagicLink,
}: AuthWindowProps) {
  return (
    <SurfaceCard accent="blue">
      <View style={styles.logoRow}>
        <Image source={require('../../../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
        <View style={styles.logoTextWrap}>
          <Text style={styles.logoTitle}>دخول نور الهدى</Text>
          <Text style={styles.logoSubtitle}>ادخل بحسابك أو استخدم التطبيق كضيف.</Text>
        </View>
      </View>

      <View style={styles.providerRow}>
        <Text style={styles.providerChip}>Email</Text>
        <Text style={styles.providerChip}>Guest</Text>
      </View>

      <View style={styles.formStack}>
        <TextField value={name} onChangeText={onChangeName} placeholder="الاسم (اختياري)" />
        <TextField value={email} onChangeText={onChangeEmail} placeholder="البريد الإلكتروني" />
        <TextField value={password} onChangeText={onChangePassword} placeholder="كلمة المرور" secureTextEntry />

        <View style={styles.actionRow}>
          <PrimaryButton label={authLoading ? '...' : 'إنشاء حساب'} onPress={onRegister} disabled={authLoading || !email.trim() || !password.trim()} />
          <GhostButton label="تسجيل الدخول" onPress={onLogin} disabled={authLoading || !email.trim() || !password.trim()} />
          <GhostButton label="الدخول كضيف" onPress={onGuest} disabled={authLoading} />
        </View>

        <GhostButton label="إعادة تعيين كلمة المرور" onPress={onResetPassword} disabled={authLoading || !email.trim()} />
        <GhostButton label="إرسال رابط الدخول" onPress={onMagicLink} disabled={authLoading || !email.trim()} />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
  },
  logoTextWrap: {
    flex: 1,
    gap: 6,
  },
  logoTitle: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.display,
    fontSize: 28,
    textAlign: 'right',
  },
  logoSubtitle: {
    color: theme.colors.creamMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  providerChip: {
    color: theme.colors.goldLight,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formStack: {
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
});
