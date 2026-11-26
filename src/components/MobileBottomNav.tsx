"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Plus,
  MapPin,
  Menu,
  FileText,
  Users,
  Container,
  BarChart3,
  UserCircle,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@/core/application/useAuthActions";
import { Button } from "@/components/ui/button";

interface MobileBottomNavProps {
  onOpenQuickRental: () => void;
}

const MORE_ROUTES = [
  {
    href: "/ctr",
    label: "Emissão de CTR",
    desc: "Gerar e consultar comprovantes de resíduos",
    icon: FileText,
  },
  {
    href: "/clientes",
    label: "Clientes",
    desc: "Cadastros, endereços de obra e contatos",
    icon: Users,
  },
  {
    href: "/gerenciamento",
    label: "Frota & Pendências",
    desc: "Caçambas no pátio, entregas e atrasos",
    icon: Container,
  },
  {
    href: "/relatorios",
    label: "Relatórios & Gastos",
    desc: "Faturamento, despesas e exportação",
    icon: BarChart3,
  },
  {
    href: "/perfil",
    label: "Perfil & Descarte",
    desc: "Dados da empresa, PIX e aterros",
    icon: UserCircle,
  },
  {
    href: "/documentacoes",
    label: "Guia do Sistema",
    desc: "Regras operacionais e ajuda rápida",
    icon: HelpCircle,
  },
] as const;

export function MobileBottomNav({ onOpenQuickRental }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const { logout } = useAuthActions();

  const isMoreActive = MORE_ROUTES.some((r) => pathname === r.href);

  return (
    <>
      {/* Barra fixa inferior Mobile (inspirada em operação de campo por polegar) */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 inset-x-0 z-[300] border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-lg px-1 text-xs font-semibold whitespace-nowrap transition-colors",
              pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            <span>Início</span>
          </Link>

          <Link
            href="/alugueis"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-lg px-1 text-xs font-semibold whitespace-nowrap transition-colors",
              pathname === "/alugueis" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Truck className="h-5 w-5" aria-hidden="true" />
            <span>Aluguéis</span>
          </Link>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              aria-label="Ação rápida: Nova Locação ou CTR"
              className="-mt-4 h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:translate-y-px transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Plus className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <Link
            href="/mapa"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-lg px-1 text-xs font-semibold whitespace-nowrap transition-colors",
              pathname === "/mapa" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="h-5 w-5" aria-hidden="true" />
            <span>Mapa</span>
          </Link>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-lg px-1 text-xs font-semibold whitespace-nowrap transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span>Mais</span>
            {isMoreActive && (
              <span className="absolute top-1.5 right-4 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </nav>

      {/* Bottom Sheet de Ação Rápida (+) */}
      {quickOpen && (
        <div
          className="md:hidden fixed inset-0 z-[400] bg-stone-950/60 backdrop-blur-[2px] flex items-end"
          onClick={() => setQuickOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Ações rápidas"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-[20px] border-t border-border bg-card text-card-foreground p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 shadow-2xl"
          >
            <div className="flex justify-center" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Ação Rápida</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuickOpen(false)}
                aria-label="Fechar ações rápidas"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setQuickOpen(false);
                  onOpenQuickRental();
                }}
                className="flex items-center gap-3.5 min-h-[56px] w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-left font-semibold"
              >
                <Truck className="h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-sm font-bold">Nova Locação</span>
                  <span className="block text-xs opacity-90">Agendar entrega e alocar caçamba</span>
                </div>
              </button>
              <Link
                href="/ctr"
                onClick={() => setQuickOpen(false)}
                className="flex items-center gap-3.5 min-h-[56px] w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-left"
              >
                <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-sm font-semibold text-foreground">Emitir CTR</span>
                  <span className="block text-xs text-muted-foreground">Controle de transporte de resíduos</span>
                </div>
              </Link>
              <Link
                href="/relatorios"
                onClick={() => setQuickOpen(false)}
                className="flex items-center gap-3.5 min-h-[56px] w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-left"
              >
                <BarChart3 className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-sm font-semibold text-foreground">Lançar Gasto / Ver Caixa</span>
                  <span className="block text-xs text-muted-foreground">Diesel, manutenção ou relatório</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet "Mais" com todos os módulos */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-[400] bg-stone-950/60 backdrop-blur-[2px] flex items-end"
          onClick={() => setMoreOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Menu operacional completo"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85dvh] flex flex-col rounded-t-[20px] border-t border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
          >
            <div className="flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="font-display text-lg font-bold">Menu Operacional</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {MORE_ROUTES.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 min-h-[56px] rounded-xl border px-3.5 py-2.5 transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background/60 hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {item.desc}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 pt-2 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setMoreOpen(false);
                  void logout();
                }}
                className="w-full text-status-danger-ink border-destructive/30 hover:bg-status-danger-bg"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Encerrar Sessão
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
