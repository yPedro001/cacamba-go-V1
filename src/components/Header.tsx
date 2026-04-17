"use client"
import { ModeToggle } from "./ModeToggle"
import { LogOut, Menu } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { useAuthActions } from "@/core/application/useAuthActions"
import { NotificationBell } from "./NotificationBell"

export function Header() {
  const { usuarioAtual, toggleSidebar } = useAppStore()
  const { logout } = useAuthActions()
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-xl bg-foreground/5 text-muted-foreground hover:text-foreground transition-all active:scale-95"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-black sm:hidden text-foreground italic tracking-tighter">
          Caçamba<span className="text-accent">Go</span>
        </h2>
        {/* Breadcrumb indicator (Visual Only) */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           Live Monitoring
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <ModeToggle />
        <NotificationBell />
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-3 bg-foreground/5 px-3 py-1.5 rounded-2xl border border-border">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-accent to-indigo-400 flex items-center justify-center text-white font-black shadow-lg shadow-accent/20">
            {usuarioAtual?.nome.charAt(0) || 'U'}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-black text-foreground leading-none">{usuarioAtual?.nome || 'Usuário'}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono mt-0.5">Admin Hub</p>
          </div>
        </div>
        
        <button 
          onClick={() => logout()} 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95" 
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
