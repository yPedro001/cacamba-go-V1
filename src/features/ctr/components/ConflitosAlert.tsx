"use client";
import React from "react";
import { CTRConflito } from "@/core/domain/ctr-types";
import { AlertTriangle, XCircle, Info } from "lucide-react";

interface ConflitosAlertProps {
  conflitos: CTRConflito[];
}

export function ConflitosAlert({ conflitos }: ConflitosAlertProps) {
  if (conflitos.length === 0) return null;

  const bloqueios = conflitos.filter((c) => c.tipo === "bloqueio");
  const avisos = conflitos.filter((c) => c.tipo === "aviso");

  return (
    <div className="space-y-2.5">
      {bloqueios.map((conflito, index) => (
        <div
          key={`bloqueio-${index}`}
          role="alert"
          className="p-3.5 bg-status-danger-bg border border-destructive/35 rounded-xl flex items-start gap-3"
        >
          <XCircle className="text-status-danger-ink shrink-0 mt-0.5 h-5 w-5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-status-danger-ink text-sm">
              Conflito que impede emissão
            </p>
            <p className="text-xs sm:text-sm text-status-danger-ink/90 mt-0.5">
              {conflito.mensagem}
            </p>
          </div>
        </div>
      ))}

      {avisos.map((conflito, index) => (
        <div
          key={`aviso-${index}`}
          role="status"
          className="p-3.5 bg-status-info-bg border border-blue-500/25 rounded-xl flex items-start gap-3"
        >
          {conflito.campo === "cliente_nomes" ? (
            <Info className="text-status-info-ink shrink-0 mt-0.5 h-5 w-5" aria-hidden="true" />
          ) : (
            <AlertTriangle
              className="text-status-warning-ink shrink-0 mt-0.5 h-5 w-5"
              aria-hidden="true"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground">{conflito.mensagem}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
