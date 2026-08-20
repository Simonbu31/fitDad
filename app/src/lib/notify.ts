import { NTFY_TOPIC } from './config'

// Fires directly from the browser to ntfy.sh (no backend hop). This is
// best-effort: if it fails (offline, ntfy down, ad-blocker) we swallow the
// error so it never blocks saving a workout.
export async function sendNotification(title: string, message: string, tags = 'muscle') {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: title,
        Tags: tags,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: message,
    })
  } catch {
    // best-effort only
  }
}
