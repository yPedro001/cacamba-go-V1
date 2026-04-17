import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MessageSquare, Edit, Trash } from 'lucide-react';
import { Cliente } from '@/core/domain/types';

interface CustomerTableProps {
  clientes: Cliente[];
  onEdit: (c: Cliente) => void;
  onDelete: (id: string) => void;
}

export function CustomerTable({
  clientes,
  onEdit,
  onDelete
}: CustomerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome & Doc</TableHead>
          <TableHead>Contatos</TableHead>
          <TableHead>Endereço</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow key={cliente.id} className="hover:bg-muted/50 transition-colors">
            <TableCell>
              <div className="font-bold text-slate-800">{cliente.nome}</div>
              <div className="text-xs text-muted-foreground">{cliente.cpfCnpj || 'Sem documento'}</div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{cliente.telefone}</span>
                {cliente.telefone && (
                  <a 
                    href={`https://wa.me/55${cliente.telefone.replace(/\D/g,'')}?text=Olá`} 
                    target="_blank" rel="noreferrer" 
                    className="flex items-center text-green-600 hover:text-green-700 text-[11px] font-bold"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp
                  </a>
                )}
              </div>
            </TableCell>
            <TableCell className="max-w-[220px] truncate text-sm text-slate-600">{cliente.endereco || '-'}</TableCell>
            <TableCell className="text-right">
              <Button 
                onClick={() => onEdit(cliente)} 
                variant="ghost" size="icon" 
                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => onDelete(cliente.id)} 
                variant="ghost" size="icon" 
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 ml-1"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {clientes.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado na base de dados.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
