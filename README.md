# Noor Al Huda | نور الهدى

English and Arabic documentation for the `Noor Al Huda` mobile app and Cloudflare backend.

---

## English

### Overview

`Noor Al Huda` is an Arabic-first Islamic mobile app built with Expo / React Native and a Cloudflare Worker backend.

- Mobile app: `apps/mobile`
- Worker API: `workers`
- Firestore config: `firebase.json`, `firestore.rules`, `firestore.indexes.json`

### Current stack

- Expo SDK 55 + React Native 0.83
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

### Features already implemented

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
- `eas-build.yml`: manually triggers an EAS cloud build

Required GitHub secrets for build workflow:

- `EXPO_TOKEN` — Expo/EAS access token

Optional GitHub secrets if you later automate worker deployment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Current build state

- New EAS builds have been started from the latest fixes.
- Android preview build ID: `27ba7766-8b32-4009-95fe-76b4690d8e0c`
- iOS simulator build ID: `f00bce55-ca1f-47ba-96c5-c23e0cd7fdb3`

### Known caveats

- iOS WidgetKit / Live Activity files are present, but production widget target validation still depends on full Xcode/cloud build success.
- Android native builds previously failed with a Gradle error; a fresh preview build is now queued/rerun after native hardening changes.

---

## العربية

### نظرة عامة

`نور الهدى` تطبيق إسلامي عربي أولاً، مبني على Expo / React Native مع خلفية Cloudflare Worker.

- تطبيق الجوال: `apps/mobile`
- واجهات الخلفية: `workers`
- إعدادات Firestore: `firebase.json` و `firestore.rules` و `firestore.indexes.json`

### التقنيات الحالية

- Expo SDK 55 و React Native 0.83
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

### الميزات المنجزة

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
- `eas-build.yml` لتشغيل بناء EAS يدوياً

المتغير السري المطلوب للبناء:

- `EXPO_TOKEN`

ومتغيرات اختيارية إذا أردت لاحقاً نشر Cloudflare من GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### حالة البناء الحالية

- تم إطلاق بنائين جديدين بعد آخر إصلاحات.
- رقم بناء Android preview: `27ba7766-8b32-4009-95fe-76b4690d8e0c`
- رقم بناء iOS simulator: `f00bce55-ca1f-47ba-96c5-c23e0cd7fdb3`

### ملاحظات مهمة

- ملفات WidgetKit و Live Activity على iOS موجودة، لكن اعتمادها النهائي ما زال مرتبطاً بنجاح بناء Xcode / EAS.
- كانت هناك أخطاء Gradle في Android سابقاً، وتم تشغيل بناء جديد بعد تقوية الإعدادات الأصلية.
