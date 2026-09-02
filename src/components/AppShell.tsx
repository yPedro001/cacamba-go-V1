"use client"
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { Loader2, AlertTriangle } from 'lucide-react'
import { BackgroundSyncProvider } from '@/shared/providers/BackgroundSyncProvider'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/Toaster'
import { supabase } from '@/lib/supabase'
import { useAuthActions } from '@/core/application/useAuthActions'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timeout após ${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(id); resolve(v) },
      (e) => { clearTimeout(id); reject(e) }
    )
  })
}

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
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const { carregarDadosDoUsuario } = useAuthActions()

  useEffect(() => {
    setMounted(true)
    const updateMobile = () => setIsMobile(window.innerWidth < 768)
    updateMobile()
    window.addEventListener('resize', updateMobile)
    return () => window.removeEventListener('resize', updateMobile)
  }, [])

  useEffect(() => {
    if (!mounted) return
    let active = true

    const checkSession = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 8000, 'getSession')
        if (!active) return
        const user = data.session?.user
        if (user && !useAppStore.getState().usuarioAtual) {
          try {
            await withTimeout(
              carregarDadosDoUsuario(user.id, user.email || '', user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário'),
              10000,
              'carregarDadosDoUsuario'
            )
          } catch (err: any) {
            console.error('[AppShell] falha ao carregar dados:', err)
            // Não força signOut automático se for timeout de rede — deixa usuário tentar novamente
            // Apenas desloga se for erro de autenticação explícito
            const msg = err?.message || ''
            if (msg.includes('JWT') || msg.includes('Invalid') || msg.includes('not authenticated')) {
              try { await supabase.auth.signOut() } catch {}
            } else {
              setAuthError(msg || 'Falha ao carregar dados. Verifique sua conexão.')
            }
          }
        }
      } catch (err: any) {
        console.error('[AppShell] getSession falhou:', err)
        if (active) setAuthError(err?.message || 'Falha ao verificar sessão.')
      } finally {
        if (active) setAuthChecked(true)
      }
    }

    void checkSession()

    // Listener reativo para mudanças de auth (login/logout/refresh) — evita ficar preso em tela branca
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return
      if (event === 'SIGNED_IN' && session?.user && !useAppStore.getState().usuarioAtual) {
        try {
          await carregarDadosDoUsuario(session.user.id, session.user.email || '', (session.user.user_metadata as any)?.nome || session.user.email?.split('@')[0] || 'Usuário')
        } catch (e) { console.error('[AppShell] onAuthStateChange load failed', e) }
      }
      if (event === 'SIGNED_OUT') {
        useAppStore.setState({ usuarioAtual: null } as any)
      }
    })

    return () => {
      active = false
      listener?.subscription.unsubscribe()
    }
  }, [mounted])

  useEffect(() => {
    if (mounted && authChecked && !usuarioAtual && pathname !== '/login') {
      router.push('/login')
    }
    if (mounted && usuarioAtual && pathname === '/login') {
      router.push('/')
    }
  }, [usuarioAtual, pathname, router, mounted, authChecked])

  // Loading inicial — nunca mais tela branca vazia: mostra spinner + mensagem
  if (!mounted || !authChecked) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
        {authError && (
          <div className="flex flex-col items-center gap-2 max-w-md px-6 text-center">
            <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle size={14} />{authError}</p>
            <button onClick={() => window.location.reload()} className="text-xs underline text-accent">Tentar novamente</button>
          </div>
        )}
      </div>
    )
  }

  // Erro não bloqueante após authChecked — mostra banner mas permite navegação para /login
  const authErrorBanner = authError ? (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
      <span className="flex items-center gap-2"><AlertTriangle size={14} />{authError}</span>
      <button onClick={() => window.location.reload()} className="underline font-bold">Recarregar</button>
    </div>
  ) : null

  // Se estiver na tela de login, renderiza apenas o conteúdo (sem sidebar/header)
  if (pathname === '/login') {
    return <>{authErrorBanner}{children}</>
  }

  // Se não estiver logado e não estiver no login, mostra um loader enquanto redireciona
  if (!usuarioAtual) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
        <p className="text-xs text-muted-foreground">Redirecionando para login...</p>
        {authErrorBanner}
      </div>
    )
  }

  return (
    <BackgroundSyncProvider>
      {/* Toasts globais - renderizado uma vez */}
      <Toaster />
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
