import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiCaller, crossSiteBlock } from '@/lib/api'
import { CATEGORY_IDS } from '@/lib/categories'

/**
 * Receipt scanning with Claude (vision + structured output).
 * The result is only a suggestion: the form shows it for the user to check before saving.
 */
const ReceiptSchema = z.object({
  is_receipt: z.boolean().describe('False if the image is not a bill or receipt'),
  merchant: z.string().describe('Shop or company name, short'),
  total_amount: z.number().describe('Final total paid, in the receipt currency, as a plain number'),
  currency: z.string().describe('ISO currency code, e.g. INR'),
  date: z.string().describe('Purchase date as YYYY-MM-DD, or empty string if not visible'),
  category: z.enum(CATEGORY_IDS),
  confidence: z.enum(['high', 'medium', 'low']),
  note: z.string().describe('One short line about anything unclear, or empty string'),
})

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type ImageType = (typeof IMAGE_TYPES)[number]
const MAX_BYTES = 5 * 1024 * 1024

const PROMPT = `Read this receipt or bill and extract the purchase.
- total_amount: the final amount paid (after tax and discounts), not a subtotal.
- category: pick the closest of: ${CATEGORY_IDS.join(', ')}.
- If a value is not visible, use an empty string (or 0 for the amount) and lower the confidence.
- If the image is not a receipt or bill, set is_receipt to false.`

let client: Anthropic | null = null

export async function POST(request: Request) {
  // Scanning costs money per call, so it is for signed-in users only.
  const caller = await apiCaller(request)
  if (!caller) return NextResponse.json({ error: 'Log in to scan receipts.', needsAuth: 'login' }, { status: 401 })
  const blocked = crossSiteBlock(request, caller)
  if (blocked) return blocked
  let file: File | null
  try {
    file = (await request.formData()).get('file') as File | null
  } catch {
    return NextResponse.json({ error: 'Upload a photo of the receipt.' }, { status: 400 })
  }
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Upload a photo of the receipt.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That file is over 5 MB. Try a smaller photo.' }, { status: 413 })

  const isPdf = file.type === 'application/pdf'
  if (!isPdf && !IMAGE_TYPES.includes(file.type as ImageType)) {
    return NextResponse.json({ error: 'Use a JPG, PNG, WEBP or PDF file.' }, { status: 415 })
  }

  const data = Buffer.from(await file.arrayBuffer()).toString('base64')
  const source: Anthropic.Beta.BetaContentBlockParam = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
    : { type: 'image', source: { type: 'base64', media_type: file.type as ImageType, data } }

  try {
    client ??= new Anthropic()
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      // Server-side fallback: if a request is declined, the API retries it on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(ReceiptSchema) },
      messages: [{ role: 'user', content: [source, { type: 'text', text: PROMPT }] }],
    })

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'This file could not be read. Enter the details by hand.' }, { status: 422 })
    }
    const parsed = response.parsed_output
    if (!parsed) return NextResponse.json({ error: 'Could not read the receipt. Enter the details by hand.' }, { status: 422 })
    if (!parsed.is_receipt) return NextResponse.json({ error: 'That doesn’t look like a receipt or bill.' }, { status: 422 })
    return NextResponse.json({ receipt: parsed })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Receipt scanning isn’t set up (add ANTHROPIC_API_KEY). Enter the details by hand.' }, { status: 503 })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Too many scans right now. Try again in a minute.' }, { status: 429 })
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[receipts] API error', err.status, err.message)
      return NextResponse.json({ error: 'The scanner had a problem. Enter the details by hand.' }, { status: 502 })
    }
    console.error('[receipts]', err)
    const message = err instanceof Error && /api key|auth/i.test(err.message)
      ? 'Receipt scanning isn’t set up (add ANTHROPIC_API_KEY). Enter the details by hand.'
      : 'Could not scan the receipt. Enter the details by hand.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
