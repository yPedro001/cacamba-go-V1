import React from "react";
import { LocacaoModal } from "./LocacaoModal";
import { useRentalsController } from "../hooks/useRentalsController";
import { Cliente, Cacamba, Perfil, Locacao } from "@/core/domain/types";

interface LocacaoModalWrapperProps {
  clientes: Cliente[];
  cacambas: Cacamba[];
  perfil: Perfil;
  triggerButton?: React.ReactNode;
  locacaoParaEditar?: Partial<Locacao>;
  onOpenModal?: (loc?: Partial<Locacao>) => void;
  onSaveLocacao?: (
    data: Partial<Locacao> & {
      salvarEndereco?: boolean;
      nomeEndereco?: string;
      enderecoDetalhes?: any;
    }
  ) => Promise<boolean>;
}

export function LocacaoModalWithGuard({
  clientes,
  cacambas,
  perfil,
  triggerButton,
  locacaoParaEditar,
  onOpenModal,
  onSaveLocacao,
}: LocacaoModalWrapperProps) {
  // Hook sempre chamado incondicionalmente (cumpre Rules of Hooks)
  const rentalsController = useRentalsController();
  const isControlled = Boolean(onOpenModal);

  const saveCallback = onSaveLocacao || rentalsController.handleSave;

  const handleOpenModal = () => {
    if (onOpenModal) {
      onOpenModal(locacaoParaEditar);
    } else {
      rentalsController.handleOpenModal(locacaoParaEditar);
    }
  };

  const handleSaveWrapper = async (
    data: Partial<Locacao> & {
      salvarEndereco?: boolean;
      nomeEndereco?: string;
      enderecoDetalhes?: any;
    }
  ) => {
    const result = await saveCallback(data);
    if (result && onOpenModal) {
      onOpenModal(undefined);
    }
    return result;
  };

  const isOpen = isControlled ? locacaoParaEditar !== undefined : rentalsController.isModalOpen;
  const handleClose = isControlled
    ? () => onOpenModal?.(undefined)
    : rentalsController.handleCloseModal;
  const editingLocacao = isControlled ? locacaoParaEditar : rentalsController.editingLocacao;

  return (
    <>
      {triggerButton && (
        <div
          onClick={handleOpenModal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenModal();
            }
          }}
        >
          {triggerButton}
        </div>
      )}

      <LocacaoModal
        isOpen={isOpen}
        onClose={handleClose}
        locacao={editingLocacao}
        onSave={handleSaveWrapper}
        onAddClienteAndSave={rentalsController.handleAddClienteAndSave}
        clientes={clientes}
        perfil={perfil}
        cacambas={cacambas}
      />
    </>
  );
}
