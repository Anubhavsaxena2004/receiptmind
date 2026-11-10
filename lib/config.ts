export const APP_NAME = 'Tinku'
export const APP_TAGLINE = 'Smart expenses & bill payments'

/**
 * Demo-only conversion. PayPal India can't take domestic INR payments, so the
 * Sandbox demo charges the USD equivalent and labels it clearly.
 */
export const DEMO_INR_PER_USD = 85

/** Server-only checks (env vars are not available in client components). */
export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}

export function paypalWebhookConfigured(): boolean {
  return paypalConfigured() && Boolean(process.env.PAYPAL_WEBHOOK_ID)
}

export function receiptScanConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_AUTH_TOKEN
  )
}
