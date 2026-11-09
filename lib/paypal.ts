/**
 * Minimal PayPal REST client (Orders v2 + webhook verification), server-side only.
 * Defaults to the Sandbox API. Client secret never reaches the browser.
 */
const BASE = (process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com').replace(/\/$/, '')

export class PayPalError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: unknown,
  ) {
    super(message)
    this.name = 'PayPalError'
  }

  /** First issue code from PayPal's error body, e.g. ORDER_ALREADY_CAPTURED. */
  get issue(): string | undefined {
    const d = this.details as { details?: { issue?: string }[] } | undefined
    return d?.details?.[0]?.issue
  }
}

export interface PayPalCapture {
  id: string
  status: string
  amount: { currency_code: string; value: string }
  custom_id?: string
  status_details?: { reason?: string }
}

export interface PayPalOrder {
  id: string
  status: string
  links?: { href: string; rel: string; method?: string }[]
  purchase_units?: {
    custom_id?: string
    payments?: { captures?: PayPalCapture[] }
  }[]
}

let tokenCache: { token: string; expiresAt: number } | null = null

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { raw: text }
  }
}

function describe(data: unknown, status: number): string {
  const d = data as { message?: string; details?: { issue?: string; description?: string }[] }
  const detail = d?.details?.[0]
  return detail?.description ?? detail?.issue ?? d?.message ?? `PayPal request failed (${status})`
}

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token
  const id = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!id || !secret) throw new PayPalError('PayPal credentials are not configured', 500, null)
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new PayPalError(`PayPal sign-in failed (${res.status})`, res.status, data)
  const { access_token, expires_in } = data as { access_token: string; expires_in: number }
  tokenCache = { token: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown, requestId?: string): Promise<T> {
  const token = await accessToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      // Idempotency: PayPal returns the original result if the same request id is retried.
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new PayPalError(describe(data, res.status), res.status, data)
  return data as T
}

export async function createOrder(input: {
  requestId: string
  amount: string
  currency: 'USD'
  customId: string
  description: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; approveUrl: string }> {
  const order = await call<PayPalOrder>(
    'POST',
    '/v2/checkout/orders',
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: input.customId,
          description: input.description.slice(0, 127),
          amount: { currency_code: input.currency, value: input.amount },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Tinku demo',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    },
    input.requestId,
  )
  const approve = order.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve')
  if (!approve) throw new PayPalError('PayPal did not return an approval link', 502, order)
  return { id: order.id, approveUrl: approve.href }
}

export function captureOrder(orderId: string, requestId: string): Promise<PayPalOrder> {
  return call<PayPalOrder>('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, requestId)
}

export function getOrder(orderId: string): Promise<PayPalOrder> {
  return call<PayPalOrder>('GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`)
}

/** Asks PayPal to confirm the webhook really came from PayPal for our webhook id. */
export async function verifyWebhookSignature(headers: Headers, event: unknown): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return false
  const h = (name: string) => headers.get(name) ?? ''
  const result = await call<{ verification_status: string }>('POST', '/v1/notifications/verify-webhook-signature', {
    auth_algo: h('paypal-auth-algo'),
    cert_url: h('paypal-cert-url'),
    transmission_id: h('paypal-transmission-id'),
    transmission_sig: h('paypal-transmission-sig'),
    transmission_time: h('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: event,
  })
  return result.verification_status === 'SUCCESS'
}
