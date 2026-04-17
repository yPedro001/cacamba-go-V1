import React from 'react';
import { LocacaoModal } from './LocacaoModal';
import { useRentalsController } from '../hooks/useRentalsController';
import { Cliente, Cacamba, Perfil } from '@/core/domain/types';
import { Button } from '@/components/ui/button';

interface LocacaoModalWrapperProps {
  clientes: Cliente[];
  cacambas: Cacamba[];
  perfil: Perfil;
  triggerButton?: React.ReactNode;
}

export function LocacaoModalWithGuard({
  clientes,
  cacambas,
  perfil,
  triggerButton
}: LocacaoModalWrapperProps) {
  const rentals = useRentalsController();

  return (
    <>
      {triggerButton && (
        <div onClick={() => rentals.handleOpenModal()}>
          {triggerButton}
        </div>
      )}
      
      <LocacaoModal
        isOpen={rentals.isModalOpen}
        onClose={rentals.handleCloseModal}
        locacao={rentals.editingLocacao}
        onSave={rentals.handleSave}
        onAddClienteAndSave={rentals.handleAddClienteAndSave}
        clientes={clientes}
        perfil={perfil}
        cacambas={cacambas}
      />
    </>
  );
}