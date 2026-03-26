import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { Locacao, Cliente } from '@/core/domain/types';

interface RentalsSummaryProps {
  inadimplentes: Locacao[];
  vencidos: Locacao[];
  pendentesEntrega: Locacao[];
  clientes: Cliente[];
  onMarkConcluida: (id: string) => void;
  onMarkPago: (id: string) => void;
  onExportPDF: (list: Locacao[], title: string) => void;
  onExportExcel: (list: Locacao[], title: string) => void;
}

export function RentalsSummary({
  inadimplentes,
  vencidos,
  pendentesEntrega,
  clientes,
  onMarkConcluida,
  onMarkPago,
  onExportPDF,
  onExportExcel
}: RentalsSummaryProps) {
  const getClientName = (id: string) => clientes.find(c => c.id === id)?.nome ?? '—';

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Inadimplentes */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-red-500 text-base">Inadimplentes</CardTitle>
          <div className="flex gap-1">
            <Button onClick={() => onExportPDF(inadimplentes, 'Relatório de Inadimplência')} variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600">
              <span className="text-[10px] font-bold">PDF</span>
            </Button>
            <Button onClick={() => onExportExcel(inadimplentes, 'Inadimplência')} variant="ghost" size="icon" className="h-7 w-7 text-green-400 hover:text-green-600">
              <span className="text-[10px] font-bold">XLS</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[250px] overflow-y-auto">
          {inadimplentes.map(l => (
            <div key={l.id} className="flex items-center justify-between pb-2 border-b border-border last:border-0 hover:bg-muted/50 p-2 rounded-md transition-colors">
              <div>
                <p className="font-semibold text-sm">{getClientName(l.clienteId)}</p>
                <p className="text-xs text-muted-foreground">Valor: R${l.valor.toFixed(2)}</p>
              </div>
              <a href="#" className="text-green-500 hover:text-green-600"><MessageSquare className="h-4 w-4" /></a>
            </div>
          ))}
          {inadimplentes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 italic">Nenhum inadimplente.</p>}
        </CardContent>
      </Card>

      {/* Vencidos (Retirar) */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-yellow-600 text-base">Vencidos (Retirar)</CardTitle>
          <div className="flex gap-1">
            <Button onClick={() => onExportPDF(vencidos, 'Relatório de Retiradas Pendentes')} variant="ghost" size="icon" className="h-7 w-7 text-yellow-500 hover:text-yellow-700">
              <span className="text-[10px] font-bold">PDF</span>
            </Button>
            <Button onClick={() => onExportExcel(vencidos, 'Retiradas')} variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-700">
              <span className="text-[10px] font-bold">XLS</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[250px] overflow-y-auto">
          {vencidos.map(l => (
            <div key={l.id} className="flex items-center justify-between pb-2 border-b border-border last:border-0 hover:bg-muted/50 p-2 rounded-md transition-colors">
              <div className="flex-1 mr-2">
                <p className="font-semibold text-sm flex items-center">
                  {l.quantidadeCacambas}x caçamba <span className="text-xs text-muted-foreground font-normal ml-2">- {getClientName(l.clienteId)}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate w-full">{l.enderecoObra}</p>
              </div>
              <Button 
                onClick={() => onMarkConcluida(l.id)} size="sm" variant="outline" 
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white h-7 px-2 text-xs transition-all"
              >
                <CheckCircle className="h-3 w-3 mr-1" /> Marcar
              </Button>
            </div>
          ))}
          {vencidos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 italic">Nenhuma caçamba vencida.</p>}
        </CardContent>
      </Card>

      {/* Pendentes de Entrega */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-blue-500 text-base">Pendentes de Entrega</CardTitle>
          <div className="flex gap-1">
            <Button onClick={() => onExportPDF(pendentesEntrega, 'Relatório de Entregas Pendentes')} variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-600">
              <span className="text-[10px] font-bold">PDF</span>
            </Button>
            <Button onClick={() => onExportExcel(pendentesEntrega, 'Entregas')} variant="ghost" size="icon" className="h-7 w-7 text-green-400 hover:text-green-600">
              <span className="text-[10px] font-bold">XLS</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[250px] overflow-y-auto">
          {pendentesEntrega.map(l => (
            <div key={l.id} className="flex items-center justify-between pb-2 border-b border-border last:border-0 hover:bg-muted/50 p-2 rounded-md transition-colors">
              <div className="flex-1 mr-2">
                <p className="font-semibold text-sm flex items-center">
                  {l.quantidadeCacambas}x caçamba <span className="text-xs text-muted-foreground font-normal ml-2">- {getClientName(l.clienteId)}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate w-full">{l.enderecoObra}</p>
              </div>
              <Button 
                onClick={() => onMarkPago(l.id)} size="sm" variant="outline" 
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white h-7 px-2 text-xs transition-all"
              >
                <CheckCircle className="h-3 w-3 mr-1" /> Entregue
              </Button>
            </div>
          ))}
          {pendentesEntrega.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 italic">Nenhuma entrega pendente.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
