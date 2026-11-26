"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  Container,
  MapPin,
  BarChart3,
  UserCircle,
  FileText,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useAuthActions } from "@/core/application/useAuthActions";
import { Button } from "@/components/ui/button";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alugueis", label: "Aluguéis", icon: Truck },
  { href: "/mapa", label: "Mapa", icon: MapPin },
  { href: "/ctr", label: "CTR", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/gerenciamento", label: "Gerenciamento", icon: Container },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useAppStore((s) => s.toggleSidebarCollapsed);
  const perfil = useAppStore((s) => s.perfil);
  const { logout } = useAuthActions();

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-border bg-card text-card-foreground sticky top-0 h-[100dvh] z-[300] transition-[width] duration-200 ease-out select-none",
        collapsed ? "w-[74px]" : "w-[244px]"
      )}
    >
      {/* Topo da marca */}
      <div className="h-14 px-3.5 border-b border-border flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded-lg"
        >
          <div className="h-9 w-9 shrink-0 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden">
            {perfil.logoUrl ? (
              <img
                src={perfil.logoUrl}
                alt={perfil.nomeEmpresa || "CaçambaGo"}
                className="h-full w-full object-contain"
              />
            ) : (
              <img src="/favicon.svg" alt="CaçambaGo" className="h-7 w-7" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-display text-base font-bold tracking-tight text-foreground block truncate">
                Caçamba<span className="text-primary">Go</span>
              </span>
              <span className="text-xs text-muted-foreground block truncate">
                {perfil.nomeEmpresa || "Gestão de Caçambas"}
              </span>
            </div>
          )}
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Links principais */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-[background-color,color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé utilitário */}
      <div className="border-t border-border p-2.5 space-y-1">
        <Link
          href="/documentacoes"
          title={collapsed ? "Guia do Sistema" : undefined}
          aria-current={pathname === "/documentacoes" ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 min-h-[42px] rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-[background-color,color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
            pathname === "/documentacoes"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Guia & Docs</span>}
        </Link>

        <button
          type="button"
          onClick={() => void logout()}
          title={collapsed ? "Sair da conta" : undefined}
          className={cn(
            "w-full flex items-center gap-3 min-h-[42px] rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:bg-status-danger-bg hover:text-status-danger-ink transition-[background-color,color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
