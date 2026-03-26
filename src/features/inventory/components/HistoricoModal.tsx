import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Cacamba } from '@/core/domain/types';

interface HistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCacamba: Cacamba | null;
}

export function HistoricoModal({
  isOpen, onClose, selectedCacamba
}: HistoricoModalProps) {
  if (!isOpen || !selectedCacamba) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-bold">Histórico — {selectedCacamba.codigo}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {(selectedCacamba.historico || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro de histórico.</p>
          ) : (
            [...(selectedCacamba.historico || [])].reverse().map((entry, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold capitalize">{entry.status}</span>
                    <span className="text-xs text-muted-foreground">{new Date(entry.data).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Por: {entry.usuario}{entry.motivo ? ` · ${entry.motivo}` : ''}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-border bg-muted/30 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
