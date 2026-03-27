# Noor Al Huda | نور الهدى

English and Arabic documentation for the `Noor Al Huda` platform: mobile app, new Next.js web app, and Cloudflare backend.

---

## English

### Overview

`Noor Al Huda` is an Arabic-first Islamic platform built with Expo / React Native for mobile, Next.js for web, and a Cloudflare Worker backend.

- Mobile app: `apps/mobile`
- Web app: `apps/web`
- Worker API: `workers`
- Firestore config: `firebase.json`, `firestore.rules`, `firestore.indexes.json`

### Current stack

- Expo SDK 55 + React Native 0.83
- Next.js 14 + React 18 web app
- Expo Router
- Zustand + TanStack Query
- SQLite + MMKV
- Firebase Auth / Firestore / notifications wiring
- Cloudflare Worker + KV + Vectorize
- Track Player for native audio playback

### Live services

- Worker URL: `https://noor-al-huda-api.shinzero.workers.dev`
- Vector index: `quran-semantic-index`
- Firebase project: `noor-al-huda-260326`
- Chosen web deployment target: `Vercel`

### Features already implemented

- Arabic-first web experience with semantic Quran search, dua generation, prayer times, and halal scanning
- Email/password, Google, guest, and passwordless email-link auth flows
- Real-time settings and bookmark sync through Firestore
- Quran reading, prayer times, azkar, radio, and settings screens
- Tajweed coach, semantic Quran search, dua generator, AR qibla, halal scanner
- Worship tracker, ruya journal, kids mode, group khatm, privacy manager
- Share cards, content flagging, achievements toast, seasonal theme hook
- Android widget bridge + iOS widget/live-activity bridge scaffolding

### Local commands

Mobile:

```bash
cd apps/mobile
npm test
npm run test:firebase
npm run doctor
node node_modules/typescript/bin/tsc --noEmit
```

Worker:

```bash
cd workers
npm test
node node_modules/typescript/bin/tsc --noEmit
```

Web app:

```bash
cd apps/web
npm run lint
npm run typecheck
```

Brand assets:

```bash
cd apps/mobile
python ./scripts/generate_brand_assets.py
```

Vector seeding / deploy:

```bash
cd workers
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... python ./scripts/seed_quran_vectors.py --batch-size 128
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... python ./scripts/deploy_worker.py
```

### GitHub Actions

This repository includes two workflows:

- `ci.yml`: installs dependencies, runs tests, type checks, and Expo Doctor
- `direct-build.yml`: builds the app directly in GitHub Actions without EAS

`ci.yml` also validates the Next.js web app on GitHub Actions.

`direct-build.yml` does the following:

- On every push to `main`: builds an installable Android ARM release APK with `expo prebuild` + `./gradlew assembleRelease` and uploads it as an artifact
- On manual dispatch: can also target iOS or both platforms

No Expo/EAS token is required for the direct build workflow.

Optional GitHub secrets if you later automate worker deployment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Current build state

- Repository workflow builds now target direct native build steps instead of EAS cloud build.
- A successful Android direct build artifact is now produced by GitHub Actions on the alternate build repo.
- Older EAS builds were only used for debugging the native failures and are no longer the GitHub Actions path.

### Known caveats

- iOS WidgetKit / Live Activity files are present, but production widget target validation still depends on full Xcode/cloud build success.
- Android native builds previously failed with a Gradle error; a fresh preview build is now queued/rerun after native hardening changes.

---

## العربية

### نظرة عامة

`نور الهدى` منصة إسلامية عربية أولاً، تضم تطبيق جوال ونسخة ويب حديثة مع خلفية Cloudflare Worker.

- تطبيق الجوال: `apps/mobile`
- تطبيق الويب: `apps/web`
- واجهات الخلفية: `workers`
- إعدادات Firestore: `firebase.json` و `firestore.rules` و `firestore.indexes.json`

### التقنيات الحالية

- Expo SDK 55 و React Native 0.83
- Next.js 14 و React 18 للويب
- Expo Router
- Zustand و TanStack Query
- SQLite و MMKV
- ربط Firebase للمصادقة و Firestore والإشعارات
- Cloudflare Worker مع KV و Vectorize
- `react-native-track-player` للصوت في المنصات الأصلية

### الخدمات الحية

- رابط العامل: `https://noor-al-huda-api.shinzero.workers.dev`
- فهرس المتجهات: `quran-semantic-index`
- مشروع Firebase: `noor-al-huda-260326`
- منصة نشر الويب المختارة: `Vercel`

### الميزات المنجزة

- تجربة ويب عربية أولاً تشمل البحث الدلالي في القرآن، ومولد الدعاء، ومواقيت الصلاة، وفحص المنتجات الحلال
- تسجيل الدخول بالبريد وكلمة المرور وGoogle والضيف والرابط البريدي بدون كلمة مرور
- مزامنة آنية للإعدادات والعلامات المرجعية عبر Firestore
- شاشات القرآن والصلاة والأذكار والإذاعة والإعدادات
- مدرب التجويد والبحث الدلالي ومولد الدعاء وبوصلة القبلة والماسح الحلال
- متابع العبادة ويومية الرؤى ووضع الأطفال والختمة الجماعية ووضع الخصوصية
- بطاقات مشاركة، نظام بلاغات للمحتوى، تنبيه الإنجاز، وثيمات موسمية
- طبقات ربط لويدجت Android وجسر iOS للويدجت والأنشطة الحية

### أوامر التشغيل المحلي

تطبيق الجوال:

```bash
cd apps/mobile
npm test
npm run test:firebase
npm run doctor
node node_modules/typescript/bin/tsc --noEmit
```

الخلفية:

```bash
cd workers
npm test
node node_modules/typescript/bin/tsc --noEmit
```

تطبيق الويب:

```bash
cd apps/web
npm run lint
npm run typecheck
```

إعادة توليد الهوية البصرية:

```bash
cd apps/mobile
python ./scripts/generate_brand_assets.py
```

زرع متجهات القرآن ونشر العامل:

```bash
cd workers
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... python ./scripts/seed_quran_vectors.py --batch-size 128
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... python ./scripts/deploy_worker.py
```

### GitHub Actions

يوجد مساران في GitHub Actions:

- `ci.yml` للتثبيت والاختبارات وفحوص TypeScript و Expo Doctor
- `direct-build.yml` لبناء التطبيق مباشرة داخل GitHub Actions بدون EAS

ويقوم `ci.yml` أيضاً بفحص نسخة الويب المبنية بـ Next.js على GitHub Actions.

مسار `direct-build.yml` يقوم بالتالي:

- عند كل push إلى `main`: تنفيذ بناء Android ARM قابل للتثبيت عبر `expo prebuild` ثم `./gradlew assembleRelease` ورفع ملف APK كـ artifact
- وعند التشغيل اليدوي: يمكن استهداف iOS أو كلا المنصتين عند الحاجة

لا يحتاج هذا المسار إلى `EXPO_TOKEN`.

ومتغيرات اختيارية إذا أردت لاحقاً نشر Cloudflare من GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### حالة البناء الحالية

- تم تحويل مسار GitHub Actions إلى بناء محلي مباشر داخل العاملات بدلاً من EAS.
- يوجد الآن بناء Android ناجح عبر GitHub Actions في المستودع البديل المخصص للتشغيل.
- بناؤا EAS السابقان استُخدما فقط لتشخيص الأعطال الأصلية، ولم يعودا مسار البناء المعتمد في GitHub Actions.

### ملاحظات مهمة

- ملفات WidgetKit و Live Activity على iOS موجودة، لكن اعتمادها النهائي ما زال مرتبطاً بنجاح بناء Xcode / EAS.
- كانت هناك أخطاء Gradle في Android سابقاً، وتم تشغيل بناء جديد بعد تقوية الإعدادات الأصلية.
