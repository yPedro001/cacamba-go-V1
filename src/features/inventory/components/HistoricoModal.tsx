import React from 'react';
import { Cacamba } from '@/core/domain/types';
import { ModalBase } from '@/components/ui/modal-base';
import { Button } from '@/components/ui/button';

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
      title={<>Histórico — <span className="text-accent">{selectedCacamba.codigo}</span></>}
      footer={
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest px-6 h-12 rounded-2xl hover:bg-muted/50 text-foreground transition-all"
        >
          Fechar
        </Button>
      }
    >
      {(selectedCacamba.historico || []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro de histórico.</p>
      ) : (
        <div className="space-y-4">
          {[...(selectedCacamba.historico || [])].reverse().map((entry, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/50 text-foreground border border-border">
              <div className="mt-1 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-bold capitalize">{entry.status}</span>
                  <span className="text-xs text-muted-foreground">{new Date(entry.data).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Por: {entry.usuario}{entry.motivo ? ` · ${entry.motivo}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalBase>
  );
}


