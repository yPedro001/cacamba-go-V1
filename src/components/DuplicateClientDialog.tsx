"use client";
import React from "react";
import { Button } from "./ui/button";
import { AlertCircle, UserCheck, UserPlus, RefreshCcw } from "lucide-react";
import { Cliente } from "@/core/domain/types";
import { ModalBase } from "@/components/ui/modal-base";

interface DuplicateClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingClient: Cliente;
  onOptionSelected: (option: "create_new" | "link_existing" | "update_and_link") => void;
}

export function DuplicateClientDialog({
  isOpen,
  onClose,
  existingClient,
  onOptionSelected,
}: DuplicateClientDialogProps) {
  if (!isOpen || !existingClient) return null;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      zIndexClassName="z-[450]"
      title={
        <div className="flex items-center gap-2.5 text-status-warning-ink">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Cliente já cadastrado</span>
        </div>
      }
      footer={
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Cancelar Operação
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground/90 leading-relaxed">
          Identificamos que o documento informado já pertence a{" "}
          <strong className="text-foreground">{existingClient?.nome || "Cliente"}</strong>. Como deseja prosseguir?
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={() => onOptionSelected("link_existing")}
            className="flex items-center gap-3.5 p-3.5 min-h-[60px] rounded-xl bg-muted/40 border border-border hover:bg-primary/10 hover:border-primary/40 transition-[background-color,border-color] duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="h-11 w-11 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <UserCheck size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Vincular ao cliente existente</p>
              <p className="text-xs text-muted-foreground">
                Ignora os dados novos e utiliza o cadastro atual.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOptionSelected("update_and_link")}
            className="flex items-center gap-3.5 p-3.5 min-h-[60px] rounded-xl bg-muted/40 border border-border hover:bg-status-success-bg hover:border-emerald-500/40 transition-[background-color,border-color] duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="h-11 w-11 shrink-0 rounded-lg bg-status-success-bg flex items-center justify-center text-status-success-ink">
              <RefreshCcw size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Atualizar dados e vincular</p>
              <p className="text-xs text-muted-foreground">
                Atualiza o cadastro existente com as novas informações.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOptionSelected("create_new")}
            className="flex items-center gap-3.5 p-3.5 min-h-[60px] rounded-xl bg-muted/40 border border-border hover:bg-muted transition-[background-color,border-color] duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="h-11 w-11 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Criar um novo mesmo assim</p>
              <p className="text-xs text-muted-foreground">
                Gera um segundo cadastro com o mesmo documento.
              </p>
            </div>
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
