import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'CaçambaGo | Gestão de Locação de Caçambas',
  description: 'Sistema completo para gerenciamento de aluguel de caçambas, controle financeiro, gestão de estoque e emissão de recibos.',
  keywords: ['caçamba', 'aluguel', 'gestão', 'entulho', 'locação'],
  authors: [{ name: 'CaçambaGo' }],
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
