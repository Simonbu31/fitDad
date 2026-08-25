import { Capacitor } from '@capacitor/core'

// Custom URL scheme registered in the native iOS project's Info.plist.
// Supabase's magic-link email redirects here after verifying the token;
// `main.tsx` listens for this scheme via @capacitor/app to catch the
// session tokens and finish signing the user in.
export const NATIVE_AUTH_CALLBACK = 'fitdad://login-callback'

/** Where Supabase should send the user after a magic-link click. */
export function authRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) return NATIVE_AUTH_CALLBACK
  return window.location.href.split('#')[0]
}
