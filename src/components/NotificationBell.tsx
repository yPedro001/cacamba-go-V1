"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { Notificacao } from "@/store/slices/ui-slice";
import { cn } from "@/lib/utils";
import { formatDateTimeBR } from "@/lib/domain-helpers";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const notificacoes = useAppStore((s) => s.notificacoes);
  const marcarNotificacaoLida = useAppStore((s) => s.marcarNotificacaoLida);
  const marcarTodasLidas = useAppStore((s) => s.marcarTodasLidas);
  const removeNotificacao = useAppStore((s) => s.removeNotificacao);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const unreadCount = notificacoes.filter((n) => !n.lida).length;
  const visibleNotifs = notificacoes.slice(0, 30);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getIcon = (n: Notificacao) => {
    if (n.tipo === "error") {
      return <AlertTriangle className="h-4 w-4 text-status-danger-ink shrink-0" aria-hidden="true" />;
    }
    if (n.tipo === "warning") {
      return <Clock className="h-4 w-4 text-status-warning-ink shrink-0" aria-hidden="true" />;
    }
    return <Info className="h-4 w-4 text-status-info-ink shrink-0" aria-hidden="true" />;
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notificações (${unreadCount} não lidas)`
            : "Notificações"
        }
        aria-expanded={isOpen}
        className="relative rounded-lg border-border bg-card hover:bg-muted"
      >
        <Bell className="h-[18px] w-[18px] text-foreground" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold tabular-nums flex items-center justify-center border-2 border-card">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Central de notificações"
          className="fixed inset-x-3 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 z-[350] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">Notificações</h4>
              {unreadCount > 0 && (
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                  {unreadCount} novas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={marcarTodasLidas}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary/10 whitespace-nowrap transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-[65dvh] sm:max-h-96 overflow-y-auto divide-y divide-border/60">
            {visibleNotifs.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-1">
                <Bell className="h-7 w-7 mx-auto text-muted-foreground/50" aria-hidden="true" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum alerta pendente no momento.
                </p>
              </div>
            ) : (
              visibleNotifs.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors",
                    !n.lida ? "bg-primary/5" : "bg-transparent opacity-80"
                  )}
                >
                  <div className="mt-0.5">{getIcon(n)}</div>
                  <button
                    type="button"
                    onClick={() => !n.lida && marcarNotificacaoLida(n.id)}
                    className="flex-1 min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {n.titulo}
                      </span>
                      {!n.lida && (
                        <span
                          className="h-2 w-2 rounded-full bg-primary shrink-0"
                          aria-label="Não lida"
                        />
                      )}
                    </div>
                    {n.mensagem && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {n.mensagem}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/80 mt-1 tabular-nums">
                      {formatDateTimeBR(n.dataCriacao, "")}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNotificacao(n.id)}
                    aria-label={`Remover alerta ${n.titulo}`}
                    className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
