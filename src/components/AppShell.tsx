"use client"
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { Loader2 } from 'lucide-react'
import { BackgroundSyncProvider } from '@/shared/providers/BackgroundSyncProvider'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { usuarioAtual } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !usuarioAtual && pathname !== '/login') {
      router.push('/login')
    }
    if (mounted && usuarioAtual && pathname === '/login') {
      router.push('/')
    }
  }, [usuarioAtual, pathname, router, mounted])

  if (!mounted) return null

  // Se estiver na tela de login, renderiza apenas o conteúdo (sem sidebar/header)
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Se não estiver logado e não estiver no login, mostra um loader enquanto redireciona
  if (!usuarioAtual) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <BackgroundSyncProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64">
          <Header />
          <main className="flex-1 p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </BackgroundSyncProvider>
  )
}
