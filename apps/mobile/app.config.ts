import type { ExpoConfig } from 'expo/config';

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://noor-al-huda-api.shinzero.workers.dev';
const config: ExpoConfig = {
  name: 'نور الهدى',
  owner: 'shinzero',
  slug: 'noor-al-huda',
  version: '1.5.0',
  runtimeVersion: '1.5.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'nooralhuda',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#13100A',
  },
  ios: {
    bundleIdentifier: 'com.nooralhuda.app',
    buildNumber: '5',
    supportsTablet: true,
    googleServicesFile: './GoogleService-Info.plist',
    usesAppleSignIn: true,
    associatedDomains: ['applinks:noor-al-huda-260326.firebaseapp.com'],
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        'نحتاج موقعك لحساب مواقيت الصلاة واتجاه القبلة بدقة.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'نستخدم الموقع لتحديث أوقات الصلاة والإشعارات حسب مدينتك.',
    },
  },
  android: {
    package: 'com.nooralhuda.app',
    versionCode: 15,
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#13100A',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'POST_NOTIFICATIONS',
      'WAKE_LOCK',
      'VIBRATE'
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'noor-al-huda-260326.firebaseapp.com',
            pathPrefix: '/__/auth'
          }
        ],
        category: ['BROWSABLE', 'DEFAULT']
      }
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-sqlite',
    [
      'expo-audio',
      {
        microphonePermission: 'نحتاج الميكروفون لتسجيل التلاوة والأوامر الصوتية.',
        enableBackgroundPlayback: true,
        enableBackgroundRecording: false
      }
    ],
    'expo-localization',
    'expo-apple-authentication',
    'expo-notifications',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          minSdkVersion: 24,
          enableProguardInReleaseBuilds: false,
          enableShrinkResourcesInReleaseBuilds: false
        },
        ios: {
          deploymentTarget: '15.1'
        }
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl,
    eas: {
      projectId: '32be95e2-3296-4cee-bfac-b753b85a07f7',
    },
    firebase: {
      projectId: 'noor-al-huda-260326',
      appId: '1:1024474386791:web:afa7b5df1cde4bfd2adfc2',
      apiKey: 'AIzaSyA0Q7SFUTkvj8iyzCM2aYk0lDwuxuMNXDE',
      authDomain: 'noor-al-huda-260326.firebaseapp.com',
      messagingSenderId: '1024474386791',
      storageBucket: 'noor-al-huda-260326.firebasestorage.app',
      projectNumber: '1024474386791',
      androidAppId: '1:1024474386791:android:3012220cd3906a662adfc2',
      iosAppId: '1:1024474386791:ios:8516d339d51848f22adfc2',
    },
  },
};

export default config;
