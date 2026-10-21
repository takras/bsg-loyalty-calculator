import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// On iOS/Android the WebView's localStorage can be cleared by the OS, so the native apps
// keep the game state in Capacitor Preferences (UserDefaults / SharedPreferences) as well.
const native = Capacitor.isNativePlatform();

export async function loadRaw(key: string): Promise<string | null> {
  if (native) {
    try {
      const { value } = await Preferences.get({ key });
      if (value) return value;
    } catch {
      // fall through to localStorage
    }
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode etc.) – the app still works, just without persistence
  }
  if (native) Preferences.set({ key, value }).catch(() => {});
}
