import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Tinku · Smart expenses & bill payments', template: '%s · Tinku' },
  description: 'Track expenses, plan bills, choose how each bill is paid, and rehearse money emergencies before they happen.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1312' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="antialiased">
        {children}
        {/* Vercel Analytics only works when hosted on Vercel (it 404s elsewhere, e.g. Render). */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  )
}
