// These are all safe to expose in client-side code:
// - the Supabase URL + publishable/anon key are meant to be public and are
//   protected by Row Level Security policies on the database.
// - the ntfy topic is an unguessable random string, not a secret credential;
//   worst case if leaked is unwanted notifications, not data access.
export const SUPABASE_URL = 'https://qsgkxvarnolcufawpcvh.supabase.co'
export const SUPABASE_ANON_KEY =
  'sb_publishable_MxSjKbGQJZplj35eya57tA_snycn4mU'
export const NTFY_TOPIC = 'fitdad-8661a1a5c1f66b51'
