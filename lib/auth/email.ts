/**
 * Transactional email (verification codes, password reset links) through Resend's
 * HTTP API. Without RESEND_API_KEY + EMAIL_FROM nothing is sent: verification shows
 * a clearly labelled demo code instead, and password reset by email is unavailable.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!emailConfigured()) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) console.warn('[email] send failed', res.status)
    return res.ok
  } catch (err) {
    console.warn('[email] send failed', err instanceof Error ? err.message : err)
    return false
  }
}
