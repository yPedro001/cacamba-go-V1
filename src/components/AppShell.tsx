"use client"
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { Loader2 } from 'lucide-react'
import { BackgroundSyncProvider } from '@/shared/providers/BackgroundSyncProvider'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    usuarioAtual, 
    sidebarOpen, 
    sidebarCollapsed, 
    setSidebarOpen 
  } = useAppStore()
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>

    )
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <BackgroundSyncProvider>
      {/* O uso de overflow-clip no lugar de overflow-hidden previne scroll horizontal sem quebrar o position: sticky do Header */}
      <div className="min-h-screen bg-background text-foreground flex relative overflow-clip">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar />
        
        <div 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
            sidebarCollapsed ? "md:ml-20" : "md:ml-64"
          )}
        >
          <Header />
          <main className={cn(
            "flex-1 p-4 md:p-6 transition-all duration-300",
            // Evita que o conteúdo mude drasticamente no mobile quando a sidebar abre
            sidebarOpen && isMobile ? "blur-[2px] opacity-80" : ""
          )}>
            {children}
          </main>
        </div>
      </div>
    </BackgroundSyncProvider>
  )
}
