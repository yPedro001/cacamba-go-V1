"use client";
import React, { useState } from "react";
import { CTR } from "@/core/domain/ctr-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Eye, Printer, Trash2, FileText } from "lucide-react";
import { formatLocalDateBR } from "@/lib/domain-helpers";

interface CTRHistoryTableProps {
  ctrs: CTR[];
  onView: (ctr: CTR) => void;
  onPrint: (ctr: CTR) => void;
  onDelete: (id: string) => void;
}

export function CTRHistoryTable({ ctrs, onView, onPrint, onDelete }: CTRHistoryTableProps) {
  const [ctrToDelete, setCtrToDelete] = useState<{ id: string; numero: string } | null>(null);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
  };

  if (ctrs.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center space-y-2">
        <FileText className="h-9 w-9 mx-auto text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm font-medium text-muted-foreground">
          Nenhum CTR emitido até o momento.
        </p>
      </Card>
    );
  }

  return (
    <>
      {/* Cards mobile (< md) */}
      <div className="space-y-3 md:hidden">
        {ctrs.map((ctr) => (
          <Card key={ctr.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-primary">N°{ctr.numero}</p>
                <p className="font-semibold text-sm text-foreground truncate mt-0.5">
                  {ctr.geradorNome}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Destino: {ctr.destinatarioNome}
                </p>
              </div>
              <Badge variant={ctr.status === "emitido" ? "success" : "secondary"}>
                {ctr.status === "emitido" ? "Emitido" : "Rascunho"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
              <span>
                {formatLocalDateBR(ctr.data)} {formatTime(ctr.horaSaida)}
              </span>
              <span>
                {ctr.residuoQuantidade} {ctr.residuoUnidade}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onView(ctr)}
                className="flex-1"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                Visualizar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onPrint(ctr)}
                aria-label={`Imprimir CTR ${ctr.numero}`}
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCtrToDelete({ id: ctr.id, numero: ctr.numero })}
                aria-label={`Excluir CTR ${ctr.numero}`}
                className="text-status-danger-ink border-destructive/30 hover:bg-status-danger-bg"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabela desktop (>= md) */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="p-3.5 font-semibold text-foreground">Nº CTR</th>
                <th className="p-3.5 font-semibold text-foreground">Data / Hora</th>
                <th className="p-3.5 font-semibold text-foreground">Gerador</th>
                <th className="p-3.5 font-semibold text-foreground">Destino</th>
                <th className="p-3.5 font-semibold text-foreground">Resíduo</th>
                <th className="p-3.5 font-semibold text-foreground">Status</th>
                <th className="p-3.5 font-semibold text-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ctrs.map((ctr) => (
                <tr key={ctr.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-primary">N°{ctr.numero}</td>
                  <td className="p-3.5 font-mono text-xs tabular-nums">
                    <div>{formatLocalDateBR(ctr.data)}</div>
                    <div className="text-muted-foreground">{formatTime(ctr.horaSaida)}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-foreground">{ctr.geradorNome}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {ctr.geradorCpfCnpj}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-foreground">{ctr.destinatarioNome}</div>
                    <div className="text-xs text-muted-foreground">{ctr.destinatarioCidade}</div>
                  </td>
                  <td className="p-3.5 font-mono text-xs tabular-nums">
                    {ctr.residuoQuantidade} {ctr.residuoUnidade}
                    {ctr.residuoClasse && (
                      <div className="text-muted-foreground font-sans">Classe {ctr.residuoClasse}</div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={ctr.status === "emitido" ? "success" : "secondary"}>
                      {ctr.status === "emitido" ? "Emitido" : "Rascunho"}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(ctr)}
                        aria-label={`Visualizar CTR ${ctr.numero}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onPrint(ctr)}
                        aria-label={`Imprimir CTR ${ctr.numero}`}
                      >
                        <Printer className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCtrToDelete({ id: ctr.id, numero: ctr.numero })}
                        aria-label={`Excluir CTR ${ctr.numero}`}
                        className="text-status-danger-ink hover:bg-status-danger-bg"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        isOpen={Boolean(ctrToDelete)}
        onClose={() => setCtrToDelete(null)}
        onConfirm={() => {
          if (ctrToDelete) {
            onDelete(ctrToDelete.id);
            setCtrToDelete(null);
          }
        }}
        title="Excluir CTR"
        description={`Tem certeza que deseja excluir o CTR N°${ctrToDelete?.numero || ""}?`}
      />
    </>
  );
}
