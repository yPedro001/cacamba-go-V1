import React from 'react';
import { LocacaoModal } from './LocacaoModal';
import { useRentalsController } from '../hooks/useRentalsController';
import { Cliente, Cacamba, Perfil, Locacao } from '@/core/domain/types';
import { Button } from '@/components/ui/button';

interface LocacaoModalWrapperProps {
  clientes: Cliente[];
  cacambas: Cacamba[];
  perfil: Perfil;
  triggerButton?: React.ReactNode;
  locacaoParaEditar?: Partial<Locacao>;
  onOpenModal?: (loc?: Partial<Locacao>) => void;
}

export function LocacaoModalWithGuard({
  clientes,
  cacambas,
  perfil,
  triggerButton,
  locacaoParaEditar,
  onOpenModal
}: LocacaoModalWrapperProps) {
  // Se passar locacaoParaEditar, usa ele. Se não, cria própria instância
  const rentalsController = onOpenModal 
    ? null 
    : useRentalsController();

  // Se temos locacaoParaEditar, usamos o controller passado via props
  const handleOpenModal = () => {
    if (onOpenModal) {
      onOpenModal(locacaoParaEditar);
    } else {
      rentalsController?.handleOpenModal();
    }
  };

  // Obtém os métodos do controller passado ou da instância local
  const isOpen = onOpenModal ? locacaoParaEditar !== undefined : rentalsController?.isModalOpen;
  const handleClose = onOpenModal ? () => onOpenModal(undefined) : rentalsController?.handleCloseModal;
  const editingLocacao = onOpenModal ? locacaoParaEditar : rentalsController?.editingLocacao;
  const handleSave = onOpenModal ? undefined : rentalsController?.handleSave;
  const handleAddClienteAndSave = onOpenModal ? undefined : rentalsController?.handleAddClienteAndSave;

  return (
    <>
      {triggerButton && (
        <div onClick={handleOpenModal}>
          {triggerButton}
        </div>
      )}
      
      <LocacaoModal
        isOpen={isOpen || false}
        onClose={handleClose || (() => {})}
        locacao={editingLocacao}
        onSave={handleSave || (async () => {})}
        onAddClienteAndSave={handleAddClienteAndSave || (async () => {})}
        clientes={clientes}
        perfil={perfil}
        cacambas={cacambas}
      />
    </>
  );
}