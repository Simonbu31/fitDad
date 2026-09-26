// Safe to expose in client-side code: this is the publishable/anon key,
// meant to be public and protected by Row Level Security on the database.
export const SUPABASE_URL = 'https://qsgkxvarnolcufawpcvh.supabase.co'
export const SUPABASE_ANON_KEY =
  'sb_publishable_MxSjKbGQJZplj35eya57tA_snycn4mU'

// Where password-reset emails link back to. Always the web app, even when
// "Forgot password" is tapped from inside the native iOS shell — there's no
// deep-link handling back into the native app (removed along with magic
// links), so the reset step always happens in the browser.
export const PUBLIC_APP_URL = 'https://simonbu31.github.io/fitDad/'
