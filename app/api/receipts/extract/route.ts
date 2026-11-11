import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiCaller, crossSiteBlock } from '@/lib/api'
import { CATEGORY_IDS } from '@/lib/categories'

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

export type ReceiptData = z.infer<typeof ReceiptSchema>

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type ImageType = (typeof IMAGE_TYPES)[number]
const MAX_BYTES = 5 * 1024 * 1024

const PROMPT = `Read this receipt or bill and extract the purchase.
- total_amount: the final amount paid (after tax and discounts), not a subtotal.
- category: pick the closest of: ${CATEGORY_IDS.join(', ')}.
- If a value is not visible, use an empty string (or 0 for the amount) and lower the confidence.
- If the image is not a receipt or bill, set is_receipt to false.`

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'extract_receipt',
    description: 'Extract purchase details from the receipt or bill',
    input_schema: {
      type: 'object',
      properties: {
        is_receipt: { type: 'boolean', description: 'False if the image is not a bill or receipt' },
        merchant: { type: 'string', description: 'Shop or company name, short' },
        total_amount: { type: 'number', description: 'Final total paid, in the receipt currency, as a plain number' },
        currency: { type: 'string', description: 'ISO currency code, e.g. INR, USD' },
        date: { type: 'string', description: 'Purchase date as YYYY-MM-DD, or empty string if not visible' },
        category: { type: 'string', enum: CATEGORY_IDS, description: 'Matching budget category' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Confidence level' },
        note: { type: 'string', description: 'One short line about anything unclear, or empty string' },
      },
      required: ['is_receipt', 'merchant', 'total_amount', 'currency', 'date', 'category', 'confidence', 'note'],
    },
  },
]

let client: Anthropic | null = null

async function extractWithGemini(apiKey: string, base64Data: string, mimeType: string): Promise<ReceiptData | null> {
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          {
            text: `${PROMPT}\nReturn ONLY valid JSON matching this schema:
{
  "is_receipt": boolean,
  "merchant": string,
  "total_amount": number,
  "currency": string,
  "date": string,
  "category": "${CATEGORY_IDS.join('" | "')}",
  "confidence": "high" | "medium" | "low",
  "note": string
}`,
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.1,
    },
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[receipts] Gemini API error:', res.status, errText)
    throw new Error(`Gemini API error (${res.status})`)
  }

  const json = await res.json()
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText || typeof rawText !== 'string') return null

  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const parsed = ReceiptSchema.safeParse(JSON.parse(cleaned))
  return parsed.success ? parsed.data : null
}

async function extractWithOpenAI(apiKey: string, base64Data: string, mimeType: string): Promise<ReceiptData | null> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const endpoint = 'https://api.openai.com/v1/chat/completions'

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${PROMPT}\nReturn ONLY JSON matching this schema:
{
  "is_receipt": boolean,
  "merchant": string,
  "total_amount": number,
  "currency": string,
  "date": string,
  "category": "${CATEGORY_IDS.join('" | "')}",
  "confidence": "high" | "medium" | "low",
  "note": string
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[receipts] OpenAI API error:', res.status, errText)
    throw new Error(`OpenAI API error (${res.status})`)
  }

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content
  if (!text) return null

  const parsed = ReceiptSchema.safeParse(JSON.parse(text))
  return parsed.success ? parsed.data : null
}

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
  const source: Anthropic.Messages.ContentBlockParam = isPdf
    ? ({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } } as unknown as Anthropic.Messages.ContentBlockParam)
    : { type: 'image', source: { type: 'base64', media_type: file.type as ImageType, data } }

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (geminiKey) {
    try {
      const receipt = await extractWithGemini(geminiKey, data, file.type)
      if (!receipt) {
        return NextResponse.json({ error: 'Could not parse the receipt details. Enter details by hand.' }, { status: 422 })
      }
      if (!receipt.is_receipt) {
        return NextResponse.json({ error: 'That doesn’t look like a receipt or bill.' }, { status: 422 })
      }
      return NextResponse.json({ receipt })
    } catch (err) {
      console.error('[receipts] Gemini error', err)
      return NextResponse.json({ error: 'Gemini scan error. Please enter details by hand.' }, { status: 502 })
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    try {
      const receipt = await extractWithOpenAI(openaiKey, data, file.type)
      if (!receipt) {
        return NextResponse.json({ error: 'Could not parse the receipt details. Enter details by hand.' }, { status: 422 })
      }
      if (!receipt.is_receipt) {
        return NextResponse.json({ error: 'That doesn’t look like a receipt or bill.' }, { status: 422 })
      }
      return NextResponse.json({ receipt })
    } catch (err) {
      console.error('[receipts] OpenAI error', err)
      return NextResponse.json({ error: 'OpenAI scan error. Please enter details by hand.' }, { status: 502 })
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
  if (!apiKey) {
    return NextResponse.json({ error: 'Receipt scanning isn’t set up. Add GEMINI_API_KEY (free), OPENAI_API_KEY, or ANTHROPIC_API_KEY in environment variables.' }, { status: 503 })
  }

  try {
    client ??= new Anthropic({ apiKey })
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest'

    const response = await client.messages.create(
      {
        model,
        max_tokens: 1024,
        tools: TOOLS,
        tool_choice: { type: 'tool', name: 'extract_receipt' },
        messages: [{ role: 'user', content: [source, { type: 'text', text: PROMPT }] }],
      },
      isPdf ? { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } } : undefined,
    )

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'extract_receipt',
    )
    if (!toolBlock || typeof toolBlock.input !== 'object' || !toolBlock.input) {
      return NextResponse.json({ error: 'Could not read the receipt. Enter the details by hand.' }, { status: 422 })
    }

    const parsed = ReceiptSchema.safeParse(toolBlock.input)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Could not read the receipt details. Enter the details by hand.' }, { status: 422 })
    }

    if (!parsed.data.is_receipt) {
      return NextResponse.json({ error: 'That doesn’t look like a receipt or bill.' }, { status: 422 })
    }

    return NextResponse.json({ receipt: parsed.data })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Anthropic API key is invalid or expired. Check ANTHROPIC_API_KEY.' }, { status: 503 })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Too many scans right now or Anthropic credit limit reached. Try again in a minute.' }, { status: 429 })
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[receipts] Anthropic API error', err.status, err.message)
      return NextResponse.json({ error: `Scanner error (${err.message}). Enter details by hand.` }, { status: 502 })
    }
    console.error('[receipts]', err)
    const message = err instanceof Error && /api key|auth/i.test(err.message)
      ? 'Receipt scanning isn’t set up (add ANTHROPIC_API_KEY in .env). Enter the details by hand.'
      : 'Could not scan the receipt. Enter the details by hand.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
