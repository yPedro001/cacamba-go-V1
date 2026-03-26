"use client"
import { ModeToggle } from "./ModeToggle"
import { LogOut } from "lucide-react"
import { useAppStore, useUsuarioAtual } from "@/store/useAppStore"
import { NotificationBell } from "./NotificationBell"

export function Header() {
  const usuarioAtual = useUsuarioAtual()
  const logout = useAppStore(s => s.logout)
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center">
        {/* Mobile menu button could go here */}
        <h2 className="text-lg font-bold sm:hidden">CaçambaGo</h2>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <ModeToggle />
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">
            {usuarioAtual?.nome.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-semibold hidden sm:inline-block">
            {usuarioAtual?.nome || 'Usuário'}
          </span>
        </div>
        <button 
          onClick={() => logout()} 
          aria-label="Sair da aplicação" 
          className="text-muted-foreground hover:text-red-500 transition-colors ml-2" 
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
