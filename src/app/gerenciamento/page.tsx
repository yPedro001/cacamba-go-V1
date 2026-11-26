'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Plus, Search } from 'lucide-react';
import { useInventoryController, InventoryTable, CacambaModal, HistoricoModal } from '@/features/inventory';
import { useRentalsController, RentalsSummary } from '@/features/rentals';
import { ConfirmModal } from '@/components/ConfirmModal';
import { getClientName } from '@/lib/business-utils';
import { usePerfil } from '@/store/useAppStore';

export default function GerenciamentoPage() {
  const perfil = usePerfil();
  const inventory = useInventoryController();
  const rentals = useRentalsController();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Gerenciamento Operacional
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pendências logísticas, cobranças e inventário físico de caçambas.
          </p>
        </div>
      </div>

      {/* Painel de pendências e exportações */}
      <RentalsSummary
        inadimplentes={rentals.inadimplentes}
        vencidos={rentals.vencidos}
        pendentesEntrega={rentals.pendentesEntrega}
        clientes={rentals.clientes}
        getClientName={(id) => getClientName(id, rentals.clientes)}
        onMarkConcluida={(id) => rentals.updateLocacao(id, { status: 'concluida' })}
        onMarkEmUso={(id) => rentals.updateLocacao(id, { status: 'em_uso' })}
        onExportPDF={rentals.exportRentals}
        onExportExcel={rentals.exportRentalsExcel}
      />

      {/* Inventário físico de caçambas */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-border">
          <CardTitle className="text-base">Estoque de Caçambas ({inventory.cacambas.length})</CardTitle>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código ou tamanho..."
                className="pl-9 min-h-[44px] text-base sm:text-sm"
                value={inventory.searchTerm}
                onChange={(e) => inventory.setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={inventory.exportPDF}
                variant="outline"
                className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
              >
                <Download className="h-4 w-4 mr-1.5 text-destructive" />
                PDF
              </Button>
              <Button
                type="button"
                onClick={inventory.exportExcel}
                variant="outline"
                className="min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
              >
                <Download className="h-4 w-4 mr-1.5 text-success" />
                Excel
              </Button>
              <Button
                type="button"
                onClick={() => inventory.handleOpenModal()}
                className="min-h-[44px] w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Caçamba
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <InventoryTable
            cacambas={inventory.filteredCacambas}
            onEdit={inventory.handleOpenModal}
            onDelete={inventory.deleteCacamba}
            onShowHistory={(c) => {
              inventory.setSelectedHistorico(c);
              inventory.setIsHistoricoOpen(true);
            }}
          />
        </CardContent>
      </Card>

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
        variant="destructive"
      />
    </div>
  );
}
