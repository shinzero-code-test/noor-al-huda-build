import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'noor-mmkv:';
const cache = new Map<string, string>();
let initialized = false;

export const storage = {
  getString(key: string) {
    return cache.get(key);
  },
  getNumber(key: string) {
    const value = cache.get(key);
    if (value == null) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  },
  set(key: string, value: string | number | boolean) {
    const normalized = String(value);
    cache.set(key, normalized);
    void AsyncStorage.setItem(`${PREFIX}${key}`, normalized);
  },
  remove(key: string) {
    cache.delete(key);
    void AsyncStorage.removeItem(`${PREFIX}${key}`);
  },
  clearAll() {
    const keys = [...cache.keys()];
    cache.clear();
    void AsyncStorage.multiRemove(keys.map((key) => `${PREFIX}${key}`));
  },
};

export async function initStorageAsync() {
  if (initialized) {
    return;
  }

  const keys = await AsyncStorage.getAllKeys();
  const scoped = keys.filter((key) => key.startsWith(PREFIX));
  if (scoped.length) {
    const entries = await AsyncStorage.multiGet(scoped);
    entries.forEach(([fullKey, value]) => {
      if (value != null) {
        cache.set(fullKey.slice(PREFIX.length), value);
      }
    });
  }
  initialized = true;
}
