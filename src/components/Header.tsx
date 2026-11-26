"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, UserCircle } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Visão Geral",
  "/alugueis": "Locações & Entregas",
  "/clientes": "Clientes",
  "/gerenciamento": "Frota & Pendências",
  "/mapa": "Mapa Operacional",
  "/ctr": "Emissão de CTR",
  "/relatorios": "Relatórios & Gastos",
  "/perfil": "Perfil & Configurações",
  "/documentacoes": "Guia do Sistema",
};

interface HeaderProps {
  onOpenQuickRental?: () => void;
}

export function Header({ onOpenQuickRental }: HeaderProps) {
  const pathname = usePathname();
  const usuarioAtual = useAppStore((s) => s.usuarioAtual);
  const perfil = useAppStore((s) => s.perfil);
  const pageTitle = ROUTE_TITLES[pathname] || "CaçambaGo";

  return (
    <header className="sticky top-0 z-[300] h-14 border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Marca compacta no mobile (sidebar está oculta < md) */}
        <Link
          href="/"
          className="md:hidden flex items-center gap-2 min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded-md"
        >
          <img src="/favicon.svg" alt="CaçambaGo" className="h-7 w-7 shrink-0" />
          <span className="font-display text-sm font-bold text-foreground truncate">
            {pathname === "/" ? (
              <>
                Caçamba<span className="text-primary">Go</span>
              </>
            ) : (
              pageTitle
            )}
          </span>
        </Link>

        {/* Título de contexto no desktop */}
        <div className="hidden md:flex items-center gap-2.5 min-w-0">
          <h2 className="font-display text-base font-bold text-foreground truncate">{pageTitle}</h2>
          {perfil.nomeEmpresa && (
            <span className="hidden lg:inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground truncate max-w-[240px]">
              {perfil.nomeEmpresa}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onOpenQuickRental && (
          <Button
            type="button"
            size="sm"
            onClick={onOpenQuickRental}
            className="hidden sm:inline-flex min-h-[40px]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Nova Locação</span>
          </Button>
        )}

        <ModeToggle />
        <NotificationBell />

        <Link
          href="/perfil"
          aria-label="Ir para Perfil e Configurações"
          className="hidden md:inline-flex items-center gap-2 min-h-[40px] rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap"
        >
          <UserCircle className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span className="max-w-[130px] truncate">{usuarioAtual?.nome || "Perfil"}</span>
        </Link>
      </div>
    </header>
  );
}
