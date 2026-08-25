import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'
import { NATIVE_AUTH_CALLBACK } from './platform'

/**
 * On native iOS/Android, tapping the magic-link email opens Supabase's
 * verify URL in the system browser, which then redirects to our custom
 * `fitdad://` scheme — the OS hands that URL to this app instead of a
 * browser tab. Capacitor surfaces it via `appUrlOpen`; we pull the tokens
 * out of the fragment ourselves since there's no `window.location` hash
 * navigation happening here like there is on the web.
 */
export function registerDeepLinkAuth() {
  if (!Capacitor.isNativePlatform()) return

  CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(NATIVE_AUTH_CALLBACK)) return

    const fragment = url.split('#')[1]
    if (!fragment) return

    const params = new URLSearchParams(fragment)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) return

    await supabase.auth.setSession({ access_token, refresh_token })
  })
}
