import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage that no-ops when there's no window — the static web export
 * prerenders the app in Node, where AsyncStorage's web backend (localStorage)
 * would throw. On device and in the browser it's a pass-through.
 */
export const safeStorage = {
  getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};
