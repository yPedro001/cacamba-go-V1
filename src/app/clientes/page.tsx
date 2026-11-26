'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Plus, Search } from 'lucide-react';
import { useCustomersController, CustomerTable, CustomerModal } from '@/features/customers';
import { ConfirmModal } from '@/components/ConfirmModal';
import { UnsavedChangesConfirmDialog } from '@/components/ui/unsaved-changes';

export default function ClientesPage() {
  const {
    filteredClientes,
    searchTerm,
    setSearchTerm,
    formError,
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
    currentClient,
    setCurrentClient,
    isEditing,
    isCepLoading,
    handleCepLookup,
    saveClient,
    deleteClient,
    confirmDelete,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    enderecosForm,
    addEnderecoField,
    removeEnderecoField,
    updateEnderecoField,
    exportPDF,
    exportExcel,
    showUnsavedConfirm,
    confirmCloseModal,
    cancelCloseModal,
  } = useCustomersController();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Base de contratantes, documentos fiscais e endereços de obras recorrentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            onClick={exportPDF}
            variant="outline"
            className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-1.5 text-destructive" />
            PDF
          </Button>
          <Button
            type="button"
            onClick={exportExcel}
            variant="outline"
            className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-1.5 text-success" />
            Excel
          </Button>
          <Button
            type="button"
            onClick={() => handleOpenModal()}
            className="min-h-[44px] w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <CardTitle className="text-base">
            Base de Clientes ({filteredClientes.length})
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, telefone ou endereço..."
              className="pl-9 min-h-[44px] text-base sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <CustomerTable
            clientes={filteredClientes}
            onEdit={handleOpenModal}
            onDelete={deleteClient}
          />
        </CardContent>
      </Card>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isEditing={isEditing}
        currentClient={currentClient}
        setCurrentClient={setCurrentClient}
        enderecosForm={enderecosForm}
        addEnderecoField={addEnderecoField}
        removeEnderecoField={removeEnderecoField}
        updateEnderecoField={updateEnderecoField}
        isCepLoading={isCepLoading}
        handleCepLookup={handleCepLookup}
        onSave={saveClient}
        formError={formError}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        variant="destructive"
      />

      <UnsavedChangesConfirmDialog
        isOpen={showUnsavedConfirm}
        onConfirm={confirmCloseModal}
        onCancel={cancelCloseModal}
        message="Tem certeza que deseja fechar? As alterações não salvas serão perdidas."
        confirmText="Sim, fechar"
        cancelText="Continuar editando"
      />
    </div>
  );
}
