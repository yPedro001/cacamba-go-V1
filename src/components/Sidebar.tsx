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
  UserCircle
} from "lucide-react"
import { useAppStore, useUsuarioAtual } from "@/store/useAppStore"

const links = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Aluguéis", href: "/alugueis", icon: Truck },
  { name: "Gerenciamento", href: "/gerenciamento", icon: Settings },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Mapa", href: "/mapa", icon: MapIcon },
  { name: "Perfil", href: "/perfil", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const usuarioAtual = useUsuarioAtual()
  const logout = useAppStore(s => s.logout)

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-border transition-transform -translate-x-full md:translate-x-0">
      <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
        <div className="mb-4 mt-2 flex flex-col items-center justify-center border-b border-border pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-4">
            Caçamba<span className="text-accent-dark">Go</span>
          </h1>
          {usuarioAtual && (
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl w-full">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                {usuarioAtual.nome.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{usuarioAtual.nome}</p>
                <p className="text-[10px] text-gray-400 truncate">{usuarioAtual.email}</p>
              </div>
            </div>
          )}
        </div>
        <ul className="space-y-2 font-medium flex-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center rounded-lg p-3 group ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="ml-3 font-semibold">{link.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-auto border-t border-border pt-4">
          <button 
            onClick={() => logout()}
            aria-label="Sair da aplicação" 
            className="flex w-full items-center rounded-lg p-3 text-gray-400 hover:bg-red-500/10 hover:text-red-500 group transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3 font-semibold">Sair da Conta</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
