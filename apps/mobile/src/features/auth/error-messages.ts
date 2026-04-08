export function mapFirebaseAuthError(message?: string) {
  const value = message?.toLowerCase() ?? '';

  if (!value) {
    return 'تعذر إكمال الطلب الآن. حاول مرة أخرى.';
  }

  if (value.includes('auth/invalid-email')) {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }

  if (value.includes('auth/missing-password')) {
    return 'أدخل كلمة المرور للمتابعة.';
  }

  if (value.includes('auth/weak-password')) {
    return 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.';
  }

  if (value.includes('auth/email-already-in-use')) {
    return 'هذا البريد مستخدم بالفعل. جرّب تسجيل الدخول أو استعادة كلمة المرور.';
  }

  if (value.includes('auth/invalid-credential') || value.includes('auth/wrong-password')) {
    return 'بيانات تسجيل الدخول غير صحيحة.';
  }

  if (value.includes('auth/user-not-found')) {
    return 'لا يوجد حساب مرتبط بهذا البريد.';
  }

  if (value.includes('auth/too-many-requests')) {
    return 'تمت محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.';
  }

  if (value.includes('auth/network-request-failed')) {
    return 'تعذر الاتصال بخوادم Firebase. تحقق من الشبكة ثم أعد المحاولة.';
  }

  if (value.includes('verification')) {
    return 'تعذر إرسال رسالة التحقق الآن. حاول بعد قليل.';
  }

  if (value.includes('password')) {
    return 'تعذر تنفيذ إجراء كلمة المرور. تحقق من البريد ثم أعد المحاولة.';
  }

  if (value.includes('email')) {
    return 'تعذر إكمال إجراء البريد الإلكتروني. تحقق من البريد ثم أعد المحاولة.';
  }

  return 'تعذر إكمال الطلب الآن. حاول مرة أخرى.';
}
