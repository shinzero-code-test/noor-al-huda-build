import { NativeModules, Platform } from 'react-native';

import { type PrayerTimesData } from '../../types/domain';

type WidgetBridgeModule = {
  updateWidget?: (payload: string) => Promise<void> | void;
};

const bridge = NativeModules.WidgetBridge as WidgetBridgeModule | undefined;

export async function updatePrayerWidget(payload: PrayerTimesData) {
  if (Platform.OS !== 'android') {
    return;
  }
  await bridge?.updateWidget?.(JSON.stringify(payload));
}
