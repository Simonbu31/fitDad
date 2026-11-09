// Fires directly from the browser to ntfy.sh (no backend hop). This is
// best-effort: if it fails (offline, ntfy down, ad-blocker, no topic
// configured) we swallow the error so it never blocks saving a workout.
// Returns the scheduled message's ntfy id (so a delayed send can later be
// canceled with cancelScheduledNotification), or null if nothing was sent.
export async function sendNotification(
  topic: string | null,
  title: string,
  message: string,
  tags = 'muscle',
  delaySeconds?: number,
): Promise<string | null> {
  if (!topic) return null
  try {
    const headers: Record<string, string> = {
      Title: title,
      Tags: tags,
      'Content-Type': 'text/plain; charset=utf-8',
    }
    // ntfy.sh queues the message server-side and delivers it as a real push
    // at the scheduled time — this is what lets the rest-over ping reach the
    // phone even while the screen is locked (the public server's minimum
    // delay is 10s, so very short rests still get here close to on-time).
    if (delaySeconds) headers['X-Delay'] = `${Math.max(10, Math.round(delaySeconds))}s`
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers,
      body: message,
    })
    const body = await res.json()
    return typeof body?.id === 'string' ? body.id : null
  } catch {
    // best-effort only
    return null
  }
}

// Cancels a message scheduled via sendNotification's delaySeconds, before
// ntfy delivers it — used to avoid a double ding when the rest timer
// finishes while the app is still in the foreground (the in-page beep
// already covered it, so the pending push is no longer needed). A cancel
// that arrives after the message already fired is a harmless no-op.
export async function cancelScheduledNotification(topic: string, id: string) {
  try {
    await fetch(`https://ntfy.sh/${topic}/${id}/delete`)
  } catch {
    // best-effort only
  }
}

export function generateTopic(): string {
  const random = crypto.getRandomValues(new Uint8Array(8))
  const hex = Array.from(random, (b) => b.toString(16).padStart(2, '0')).join('')
  return `fitdad-${hex}`
}
