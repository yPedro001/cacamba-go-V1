import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, History } from 'lucide-react';
import { Cacamba } from '@/core/domain/types';

interface InventoryTableProps {
  cacambas: Cacamba[];
  onEdit: (c: Cacamba) => void;
  onDelete: (id: string) => void;
  onViewHistory: (c: Cacamba) => void;
}

export function InventoryTable({
  cacambas,
  onEdit,
  onDelete,
  onViewHistory
}: InventoryTableProps) {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'disponivel': return <Badge variant="success">Disponível</Badge>;
      case 'locada': return <Badge variant="warning">Em Uso</Badge>;
      case 'entrega_pendente': return <Badge className="bg-blue-500 hover:bg-blue-600">Entrega Pendente</Badge>;
      case 'vencida': return <Badge variant="destructive">Retirar Agora</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Identificador</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead>Endereço Atual</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cacambas.map((cacamba) => (
          <TableRow key={cacamba.id} className="hover:bg-muted/50">
            <TableCell className="font-bold">{cacamba.codigo}</TableCell>
            <TableCell>{cacamba.tamanho || '—'}</TableCell>
            <TableCell className="truncate max-w-[150px] text-muted-foreground">
              {cacamba.enderecoAtual || 'Pátio'}
            </TableCell>
            <TableCell>{getStatusBadge(cacamba.status)}</TableCell>
            <TableCell className="text-right">
              <Button 
                onClick={() => onEdit(cacamba)} 
                variant="ghost" size="icon" 
                className="h-8 w-8 text-blue-500 hover:text-blue-600" 
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {(cacamba.historico?.length ?? 0) > 0 && (
                <Button 
                  onClick={() => onViewHistory(cacamba)} 
                  variant="ghost" size="icon" 
                  className="h-8 w-8 text-yellow-500" 
                  title="Histórico"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              <Button 
                onClick={() => onDelete(cacamba.id)} 
                variant="ghost" size="icon" 
                className="h-8 w-8 text-red-500 ml-1" 
                title="Excluir"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {cacambas.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
              Nenhuma caçamba encontrada.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
