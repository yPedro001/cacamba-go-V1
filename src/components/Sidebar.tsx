"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Truck,
  Settings,
  BarChart3,
  Map as MapIcon,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  FileText
} from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { useAuthActions } from "@/core/application/useAuthActions"
import { cn } from "@/lib/utils"

const links = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "CTR", href: "/ctr", icon: FileText },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Aluguéis", href: "/alugueis", icon: Truck },
  { name: "Gerenciamento", href: "/gerenciamento", icon: Settings },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Mapa", href: "/mapa", icon: MapIcon },
  { name: "Perfil", href: "/perfil", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { usuarioAtual, sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } = useAppStore()
  const { logout } = useAuthActions()

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-[#020617] border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[20px_0_50px_-15px_rgba(0,0,0,0.5)]",
        // Mobile behavior
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
        // Desktop behavior
        sidebarCollapsed ? "md:w-[80px]" : "md:w-64"
      )}
    >
      <div className="flex h-full flex-col px-4 py-8 overflow-hidden relative">
        {/* Glow Effect Top - More Intense for SaaS Premium look */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-accent/10 blur-[120px] pointer-events-none opacity-50" />
        <div className="absolute top-1/2 left-0 w-12 h-64 bg-accent/5 blur-[80px] pointer-events-none" />

        {/* HEADER & TOGGLE */}
        <div className={cn(
          "mb-8 flex items-center px-1",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20 rotate-[-4deg]">
                <Truck size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-white italic">
                Caçamba<span className="text-accent">Go</span>
              </h1>
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
              <Truck size={18} />
            </div>
          )}
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
          <ul className="space-y-1 font-medium">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <li key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
                    className={cn(
                      "flex items-center rounded-xl p-3 transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? "bg-accent/10 text-accent shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]"
                        : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-100",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                    title={sidebarCollapsed ? link.name : ""}
                  >
                    {/* Active Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full shadow-[0_0_10px_rgba(99,102,241,1)]" />
                    )}

                    <Icon className={cn(
                      "h-[20px] w-[20px] transition-all duration-300 shrink-0", 
                      isActive ? "text-accent scale-110" : "group-hover:text-slate-100 group-hover:scale-110"
                    )} />
                    
                    {!sidebarCollapsed && (
                      <span className="ml-3.5 font-bold text-[13px] tracking-tight truncate animate-in fade-in slide-in-from-left-2 duration-300">
                        {link.name}
                      </span>
                    )}

                    {/* Active Glow */}
                    {isActive && !sidebarCollapsed && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(99,102,241,1)]" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* FOOTER - USUÁRIO E SAIR */}
        <div className="mt-auto pt-4 space-y-3">
          {/* USER INFO */}
          {usuarioAtual && (
             <div className={cn(
              "flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-2xl transition-all",
              sidebarCollapsed ? "justify-center p-1.5" : "p-2.5"
            )}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-indigo-400 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-accent/20 shrink-0">
                {usuarioAtual.nome.charAt(0)}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1 animate-in fade-in duration-500">
                  <p className="text-xs font-black text-white truncate leading-none mb-1">{usuarioAtual.nome}</p>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-mono">
                    {usuarioAtual.email.split('@')[0]}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!sidebarCollapsed && (
              <button 
                onClick={toggleSidebarCollapsed}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest"
              >
                <PanelLeftClose size={14} />
                Recolher
              </button>
            )}

            <button 
              onClick={() => logout()}
              className={cn(
                "flex items-center justify-center rounded-xl transition-all group",
                sidebarCollapsed 
                  ? "w-full h-11 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                  : "p-2.5 border border-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
              )}
              title="Sair da Conta"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
              {!sidebarCollapsed && <span className="sr-only">Sair</span>}
            </button>
          </div>

          {/* Expand Toggle for Collapsed State */}
          {sidebarCollapsed && (
            <button 
              onClick={toggleSidebarCollapsed}
              className="w-full flex items-center justify-center p-2.5 rounded-xl border border-white/5 text-slate-400 hover:bg-accent/10 hover:text-accent transition-all"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
