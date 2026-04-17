"use client";
import React from 'react';
import { CTRConflito } from '@/core/domain/ctr-types';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';

interface ConflitosAlertProps {
  conflitos: CTRConflito[];
}

export function ConflitosAlert({ conflitos }: ConflitosAlertProps) {
  if (conflitos.length === 0) {
    return null;
  }

  const bloqueios = conflitos.filter(c => c.tipo === 'bloqueio');
  const avisos = conflitos.filter(c => c.tipo === 'aviso');

  return (
    <div className="space-y-3">
      {bloqueios.map((conflito, index) => (
        <div 
          key={`bloqueio-${index}`}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-bold text-red-500 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Bloqueio
            </p>
            <p className="text-sm text-red-400/90 mt-1">{conflito.mensagem}</p>
            {conflito.valores && (
              <p className="text-xs text-red-400/70 mt-1 font-mono">
                Detalhes: {conflito.valores.join(', ')}
              </p>
            )}
          </div>
        </div>
      ))}

      {avisos.map((conflito, index) => (
        <div 
          key={`aviso-${index}`}
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-bold text-amber-500 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Atenção
            </p>
            <p className="text-sm text-amber-400/90 mt-1">{conflito.mensagem}</p>
            {conflito.valores && (
              <p className="text-xs text-amber-400/70 mt-1 font-mono">
                Detalhes: {conflito.valores.join(', ')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
