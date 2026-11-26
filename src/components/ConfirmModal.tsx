"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ModalBase } from "@/components/ui/modal-base";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  /** Texto do botão de confirmação. Default: "Confirmar" */
  confirmText?: string;
  /** Controla a aparência visual do botão de confirmação. Default: "destructive" */
  variant?: 'destructive' | 'default';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  variant = 'destructive',
}: ConfirmModalProps) {
  const { updateConfiguracoes } = useAppStore();
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirm = () => {
    if (dontAskAgain) {
      updateConfiguracoes({ pularConfirmacaoExclusao: true });
    }
    onConfirm();
    onClose();
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      zIndexClassName="z-[450]"
      title={
        <div className="flex items-center gap-2.5 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{title}</span>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant={variant} onClick={handleConfirm} className="w-full sm:w-auto">
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-foreground/90 leading-relaxed">{description}</p>

        <label
          htmlFor="dont-ask-again"
          className="inline-flex items-center gap-3 min-h-[44px] cursor-pointer select-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-[color,background-color] duration-150"
        >
          <input
            type="checkbox"
            id="dont-ask-again"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
            className="h-4 w-4 accent-primary rounded cursor-pointer"
          />
          <span>Não perguntar novamente nesta conta</span>
        </label>
      </div>
    </ModalBase>
  );
}
