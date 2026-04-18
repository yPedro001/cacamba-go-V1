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
  onSaveLocacao?: (data: Partial<Locacao> & { salvarEndereco?: boolean, nomeEndereco?: string, enderecoDetalhes?: any }) => Promise<boolean>;
}

export function LocacaoModalWithGuard({
  clientes,
  cacambas,
  perfil,
  triggerButton,
  locacaoParaEditar,
  onOpenModal,
  onSaveLocacao
}: LocacaoModalWrapperProps) {
  // Se passar locacaoParaEditar, usa ele. Se não, cria própria instância
  const rentalsController = onOpenModal 
    ? null 
    : useRentalsController();

  // Se temos onSaveLocacao externo, usa ele. Se não, usa o do controller
  const saveCallback = onSaveLocacao || rentalsController?.handleSave;

  // Se temos locacaoParaEditar, usamos o controller passado via props
  const handleOpenModal = () => {
    if (onOpenModal) {
      onOpenModal(locacaoParaEditar);
    } else {
      rentalsController?.handleOpenModal();
    }
  };

  // Função wrapper para salvar - fecha o modal após salvar
  const handleSaveWrapper = async (data: Partial<Locacao> & { salvarEndereco?: boolean, nomeEndereco?: string, enderecoDetalhes?: any }) => {
    const result = await saveCallback?.(data);
    // Fecha o modal após salvar
    if (onOpenModal) {
      onOpenModal(undefined);
    }
    return result;
  };

  // Obtém os métodos do controller passado ou da instância local
  const isOpen = onOpenModal ? locacaoParaEditar !== undefined : rentalsController?.isModalOpen;
  const handleClose = onOpenModal ? () => onOpenModal(undefined) : rentalsController?.handleCloseModal;
  const editingLocacao = onOpenModal ? locacaoParaEditar : rentalsController?.editingLocacao;

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
        onSave={handleSaveWrapper || (async () => {})}
        onAddClienteAndSave={rentalsController?.handleAddClienteAndSave || (async () => {})}
        clientes={clientes}
        perfil={perfil}
        cacambas={cacambas}
      />
    </>
  );
}