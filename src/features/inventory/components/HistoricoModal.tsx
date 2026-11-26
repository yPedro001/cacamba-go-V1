import React from "react";
import { Cacamba } from "@/core/domain/types";
import { ModalBase } from "@/components/ui/modal-base";
import { Button } from "@/components/ui/button";
import { formatDateTimeBR } from "@/lib/domain-helpers";

interface HistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCacamba: Cacamba | null;
}

export function HistoricoModal({ isOpen, onClose, selectedCacamba }: HistoricoModalProps) {
  if (!selectedCacamba) return null;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <>
          Histórico — <span className="font-mono text-primary">{selectedCacamba.codigo}</span>
        </>
      }
      footer={
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Fechar
        </Button>
      }
    >
      {(selectedCacamba.historico || []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum registro de movimentação para esta caçamba.
        </p>
      ) : (
        <div className="space-y-3">
          {[...(selectedCacamba.historico || [])].reverse().map((entry, i) => (
            <div
              key={`${entry.data}-${i}`}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 text-foreground border border-border"
            >
              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold capitalize">
                    {entry.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {formatDateTimeBR(entry.data)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Por: {entry.usuario}
                  {entry.motivo ? ` · ${entry.motivo}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalBase>
  );
}
