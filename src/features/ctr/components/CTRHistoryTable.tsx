"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CTR } from '@/core/domain/ctr-types';
import { Eye, Printer, Trash2, FileDown, FileText } from 'lucide-react';

interface CTRHistoryTableProps {
  ctrs: CTR[];
  onView: (ctr: CTR) => void;
  onPrint: (ctr: CTR) => void;
  onDelete: (id: string) => void;
}

export function CTRHistoryTable({ ctrs, onView, onPrint, onDelete }: CTRHistoryTableProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  if (ctrs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText size={48} className="mx-auto mb-4 opacity-20" />
        <p className="font-bold text-lg">Nenhum CTR emitido</p>
        <p className="text-sm mt-1">Os CTRs emitidos aparecerão aqui</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Hora</TableHead>
          <TableHead>Gerador</TableHead>
          <TableHead>Destinatário</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ctrs
          .sort((a, b) => (b.createdAt || b.data || '').localeCompare(a.createdAt || a.data || ''))
          .map(ctr => (
          <TableRow key={ctr.id} className="hover:bg-muted/50">
            <TableCell>
              <span className="font-mono font-bold">{ctr.numero}</span>
            </TableCell>
            <TableCell>{formatDate(ctr.data)}</TableCell>
            <TableCell>{formatTime(ctr.horaSaida)}</TableCell>
            <TableCell>
              <div className="max-w-[200px] truncate" title={ctr.geradorNome}>
                {ctr.geradorNome}
              </div>
            </TableCell>
            <TableCell>
              <div className="max-w-[200px] truncate" title={ctr.destinatarioNome}>
                {ctr.destinatarioNome}
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                variant={ctr.status === 'emitido' ? 'success' : 'secondary'}
                className={ctr.status === 'emitido' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
              >
                {ctr.status === 'emitido' ? 'Emitido' : ctr.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(ctr)}
                  className="h-8 w-8 text-accent hover:bg-accent/10"
                  title="Visualizar"
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPrint(ctr)}
                  className="h-8 w-8 hover:bg-accent/10"
                  title="Imprimir"
                >
                  <Printer size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este CTR?')) {
                      onDelete(ctr.id);
                    }
                  }}
                  className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
