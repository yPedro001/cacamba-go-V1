"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Locacao, Cliente } from '@/core/domain/types';
import { Check, Search, Truck } from 'lucide-react';
import { useClientes } from '@/store/useAppStore';

interface SelecaoAlugueisProps {
  locacoes: Locacao[];
  selecionados: Locacao[];
  onSelecionar: (locacoes: Locacao[]) => void;
}

export function SelecaoAlugueis({ locacoes, selecionados, onSelecionar }: SelecaoAlugueisProps) {
  const clientes = useClientes();
  const [search, setSearch] = useState('');

  const filteredLocacoes = locacoes.filter(l => {
    const cliente = clientes.find(c => c.id === l.clienteId);
    const searchLower = search.toLowerCase();
    return (
      l.enderecoObra.toLowerCase().includes(searchLower) ||
      cliente?.nome.toLowerCase().includes(searchLower) ||
      l.id?.toLowerCase().includes(searchLower)
    );
  });

  const isSelected = (id: string) => selecionados.some(l => l.id === id);

  const toggleSelecao = (locacao: Locacao) => {
    if (isSelected(locacao.id!)) {
      onSelecionar(selecionados.filter(l => l.id !== locacao.id));
    } else {
      onSelecionar([...selecionados, locacao]);
    }
  };

  const selectAll = () => {
    onSelecionar(filteredLocacoes);
  };

  const clearAll = () => {
    onSelecionar([]);
  };

  const getClientName = (clienteId: string) => {
    return clientes.find(c => c.id === clienteId)?.nome || 'Cliente não encontrado';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black italic uppercase tracking-wider flex items-center gap-2">
            <Truck size={16} className="text-accent" />
            Selecionar Aluguéis
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={selectAll}
              className="h-8 text-xs font-bold uppercase tracking-wider"
            >
              Selecionar Todos
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="h-8 text-xs font-bold uppercase tracking-wider"
            >
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, endereço..."
            className="h-10 pl-9 rounded-xl"
          />
        </div>

        {selecionados.length > 0 && (
          <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
            <p className="text-xs font-bold text-accent mb-2">
              {selecionados.length} aluguel(is) selecionado(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {selecionados.map(l => (
                <span 
                  key={l.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-lg text-xs font-bold"
                >
                  <Check size={12} className="text-accent" />
                  {getClientName(l.clienteId).substring(0, 20)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {filteredLocacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhum aluguel encontrado</p>
            </div>
          ) : (
            filteredLocacoes.map(locacao => {
              const selected = isSelected(locacao.id!);
              const cliente = clientes.find(c => c.id === locacao.clienteId);
              
              return (
                <button
                  key={locacao.id}
                  onClick={() => toggleSelecao(locacao)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selected 
                      ? 'bg-accent/10 border-accent/30' 
                      : 'bg-background border-border hover:border-accent/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      selected 
                        ? 'bg-accent border-accent' 
                        : 'border-muted-foreground/30'
                    }`}>
                      {selected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{cliente?.nome || 'Cliente não identificado'}</p>
                      <p className="text-xs text-muted-foreground truncate">{locacao.enderecoObra}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          locacao.status === 'em_uso' ? 'bg-amber-500/10 text-amber-500' :
                          locacao.status === 'vencida' ? 'bg-red-500/10 text-red-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {locacao.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {locacao.quantidadeCacambas || 1} caçamba(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
