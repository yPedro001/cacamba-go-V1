"use client"

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useInventoryController, InventoryTable, CacambaModal, HistoricoModal } from '@/features/inventory'
import { useRentalsController, RentalsSummary, LocacaoModal } from '@/features/rentals'
import { ConfirmModal } from '@/components/ConfirmModal'
import { usePerfil } from '@/store/useAppStore'

export default function GerenciamentoPage() {
  const perfil = usePerfil();
  
  // Feature de Inventário (Ativos Físicos)
  const inventory = useInventoryController();
  
  // Feature de Aluguéis (Contratos e Financeiro)
  const rentals = useRentalsController();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento Operacional</h2>
      </div>

      {/* Grid de Resumo Financeiro (Aluguéis) */}
      <RentalsSummary 
        inadimplentes={rentals.inadimplentes}
        vencidos={rentals.vencidos}
        pendentesEntrega={rentals.pendentesEntrega}
        clientes={rentals.clientes}
        onMarkConcluida={(id) => rentals.updateLocacao(id, { status: 'concluida' })}
        onMarkPago={(id) => rentals.updateLocacao(id, { status: 'pago' })}
        onExportPDF={rentals.exportRentals}
        onExportExcel={rentals.exportRentalsExcel}
      />

      {/* Gestão de Estoque (Inventário) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <CardTitle>Estoque de Caçambas</CardTitle>
          <div className="flex gap-2">
            <Button onClick={inventory.exportPDF} variant="outline" size="sm" className="h-9 border-red-200 text-red-700 hover:bg-red-50">
              PDF
            </Button>
            <Button onClick={inventory.exportExcel} variant="outline" size="sm" className="h-9 border-green-200 text-green-700 hover:bg-green-50">
              Excel
            </Button>
            <div className="relative w-full max-w-xs ml-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Buscar por ID ou Tamanho..." 
                className="pl-8 h-9" 
                value={inventory.searchTerm}
                onChange={e => inventory.setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => inventory.handleOpenModal()} 
              size="sm" 
              className="bg-accent hover:bg-accent-dark text-white font-semibold h-9"
            >
              <Plus className="h-4 w-4 mr-1" /> Nova Caçamba
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <InventoryTable 
            cacambas={inventory.filteredCacambas}
            onEdit={inventory.handleOpenModal}
            onDelete={inventory.deleteCacamba}
            onViewHistory={(c) => { inventory.setSelectedHistorico(c); inventory.setIsHistoricoOpen(true); }}
          />
        </CardContent>
      </Card>

      {/* Modais de Inventário */}
      <CacambaModal 
        isOpen={inventory.isModalOpen}
        onClose={inventory.handleCloseModal}
        isEditing={inventory.isEditing}
        currentCacamba={inventory.currentCacamba}
        setCurrentCacamba={inventory.setCurrentCacamba}
        batchQuantity={inventory.batchQuantity}
        setBatchQuantity={inventory.setBatchQuantity}
        isCepLoading={inventory.isCepLoading}
        handleCepLookup={inventory.handleCepLookup}
        onSave={inventory.saveCacamba}
        alertMessage={inventory.alertMessage}
        perfil={perfil}
      />

      <HistoricoModal 
        isOpen={inventory.isHistoricoOpen}
        onClose={() => inventory.setIsHistoricoOpen(false)}
        selectedCacamba={inventory.selectedHistorico}
      />

      <ConfirmModal
        isOpen={inventory.isDeleteModalOpen}
        onClose={() => inventory.setIsDeleteModalOpen(false)}
        onConfirm={inventory.confirmDelete}
        title="Excluir Caçamba"
        description="Tem certeza que deseja apagar esta caçamba do estoque? Esta ação é irreversível."
      />

      {/* Modais de Aluguéis */}
      <LocacaoModal 
        isOpen={rentals.isModalOpen}
        onClose={rentals.handleCloseModal}
        locacao={rentals.editingLocacao}
        onSave={rentals.handleSave}
        clientes={rentals.clientes}
        perfil={perfil}
      />
    </div>
  );
}
