// Fires directly from the browser to ntfy.sh (no backend hop). This is
// best-effort: if it fails (offline, ntfy down, ad-blocker, no topic
// configured) we swallow the error so it never blocks saving a workout.
export async function sendNotification(topic: string | null, title: string, message: string, tags = 'muscle') {
  if (!topic) return
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
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

export function generateTopic(): string {
  const random = crypto.getRandomValues(new Uint8Array(8))
  const hex = Array.from(random, (b) => b.toString(16).padStart(2, '0')).join('')
  return `fitdad-${hex}`
}
