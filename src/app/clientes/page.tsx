"use client"
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Plus, Search } from 'lucide-react'
import { useCustomersController, CustomerTable, CustomerModal } from '@/features/customers'
import { ConfirmModal } from '@/components/ConfirmModal'

export default function ClientesPage() {
  const {
    filteredClientes, searchTerm, setSearchTerm,
    isModalOpen, handleOpenModal, handleCloseModal,
    currentClient, setCurrentClient, isEditing,
    isCepLoading, handleCepLookup, saveClient,
    deleteClient, confirmDelete, isDeleteModalOpen, setIsDeleteModalOpen,
    enderecosForm, addEnderecoField, removeEnderecoField, updateEnderecoField,
    exportPDF, exportExcel
  } = useCustomersController();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={exportPDF} variant="outline" className="shadow-sm font-semibold border-red-200 hover:bg-red-50 text-red-700">
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button onClick={exportExcel} variant="outline" className="shadow-sm font-semibold border-green-200 hover:bg-green-50 text-green-700">
            <Download className="h-4 w-4 mr-2" /> EXCEL
          </Button>
          <Button onClick={() => handleOpenModal()} className="bg-accent hover:bg-accent-dark text-white font-bold shadow-md ml-2">
            <Plus className="h-4 w-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border bg-slate-50/50 rounded-t-xl">
          <CardTitle className="text-lg">Base de Clientes</CardTitle>
          <div className="relative w-full max-sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar por nome, telefone ou endereço..." 
              className="pl-8 h-9 shadow-inner" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <CustomerTable 
            clientes={filteredClientes}
            onEdit={handleOpenModal}
            onDelete={deleteClient}
          />
        </CardContent>
      </Card>

      {/* Feature Modals */}
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
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Históricos de aluguéis passados serão preservados, mas o vínculo com este cadastro será apagado. Esta ação é irreversível."
      />
    </div>
  )
}
