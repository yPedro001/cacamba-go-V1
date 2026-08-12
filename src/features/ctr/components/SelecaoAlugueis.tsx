"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cliente, Locacao } from '@/core/domain/types';
import { AlertTriangle, Check, Search, Truck, UserRound } from 'lucide-react';
import { useClientes } from '@/store/useAppStore';

interface SelecaoAlugueisProps {
  locacoes: Locacao[];
  selecionados: Locacao[];
  clienteSelecionado: Cliente | null;
  onSelecionar: (locacoes: Locacao[]) => void;
  onSelecionarCliente: (cliente: Cliente) => void;
}

const normalizeSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

export function SelecaoAlugueis({
  locacoes,
  selecionados,
  clienteSelecionado,
  onSelecionar,
  onSelecionarCliente,
}: SelecaoAlugueisProps) {
  const clientes = useClientes();
  const [search, setSearch] = useState('');
  const normalizedSearch = normalizeSearch(search);

  const clientesMap = useMemo(
    () => new Map(clientes.map(cliente => [cliente.id, cliente])),
    [clientes]
  );

  const filteredClientes = useMemo(() => clientes.filter(cliente => {
    const enderecos = cliente.enderecos?.map(endereco =>
      `${endereco.nome} ${endereco.rua} ${endereco.numero} ${endereco.cidade} ${endereco.cep || ''}`
    ).join(' ') || '';
    const searchable = normalizeSearch([
      cliente.nome,
      cliente.cpfCnpj,
      cliente.telefone,
      cliente.email,
      cliente.endereco,
      enderecos,
    ].filter(Boolean).join(' '));
    return !normalizedSearch || searchable.includes(normalizedSearch);
  }), [clientes, normalizedSearch]);

  const filteredLocacoes = useMemo(() => locacoes.filter(locacao => {
    const cliente = clientesMap.get(locacao.clienteId);
    const searchable = normalizeSearch([
      locacao.enderecoObra,
      cliente?.nome,
      cliente?.cpfCnpj,
      cliente?.telefone,
      locacao.id,
    ].filter(Boolean).join(' '));
    return !normalizedSearch || searchable.includes(normalizedSearch);
  }), [clientesMap, locacoes, normalizedSearch]);

  const dadosAusentes = useMemo(() => {
    if (!clienteSelecionado) return [];
    const possuiEndereco = Boolean(clienteSelecionado.endereco?.trim() || clienteSelecionado.enderecos?.length);
    const possuiContato = Boolean(clienteSelecionado.telefone?.trim() || clienteSelecionado.email?.trim());
    return [
      !possuiEndereco ? 'endereço' : null,
      !possuiContato ? 'telefone ou e-mail' : null,
    ].filter((item): item is string => Boolean(item));
  }, [clienteSelecionado]);

  const isSelected = (id: string) => selecionados.some(locacao => locacao.id === id);

  const toggleSelecao = (locacao: Locacao) => {
    if (isSelected(locacao.id!)) {
      onSelecionar(selecionados.filter(item => item.id !== locacao.id));
    } else {
      onSelecionar([...selecionados, locacao]);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-black italic uppercase tracking-wider flex items-center gap-2">
            <UserRound size={16} className="text-accent" />
            Selecionar cliente
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onSelecionar(filteredLocacoes)} className="h-8 text-xs font-bold uppercase">
              Todos aluguéis
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onSelecionar([])} className="h-8 text-xs font-bold uppercase">
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
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar nome, CPF/CNPJ, telefone ou endereço..."
            aria-label="Buscar clientes e aluguéis"
            className="h-10 pl-9 rounded-xl"
          />
        </div>

        {clienteSelecionado && (
          <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
            <p className="text-xs font-bold text-accent mb-1">Cliente selecionado</p>
            <p className="text-sm font-bold truncate">{clienteSelecionado.nome}</p>
            <p className="text-xs text-muted-foreground">{clienteSelecionado.cpfCnpj}</p>
            {selecionados.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{selecionados.length} aluguel(is) selecionado(s)</p>
            )}
          </div>
        )}

        {clienteSelecionado && dadosAusentes.length > 0 && (
          <div role="alert" className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">Cadastro incompleto</p>
              <p className="text-xs mt-0.5">
                Este cliente não possui {dadosAusentes.join(' e ')} suficiente. Complete os campos manualmente no CTR ou atualize o cadastro do cliente.
              </p>
            </div>
          </div>
        )}

        <div className="max-h-[330px] overflow-y-auto space-y-2 pr-1">
          <p className="px-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Clientes cadastrados ({filteredClientes.length})
          </p>
          {filteredClientes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <UserRound size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhum cliente encontrado</p>
            </div>
          ) : filteredClientes.map(cliente => {
            const selected = clienteSelecionado?.id === cliente.id && selecionados.length === 0;
            return (
              <button
                type="button"
                key={cliente.id}
                onClick={() => {
                  onSelecionar([]);
                  onSelecionarCliente(cliente);
                }}
                aria-pressed={selected}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selected ? 'bg-accent/10 border-accent/30' : 'bg-background border-border hover:border-accent/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <UserRound size={18} className="mt-0.5 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{cliente.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[cliente.cpfCnpj, cliente.telefone, cliente.endereco].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          <p className="px-1 pt-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Aluguéis em aberto ({filteredLocacoes.length})
          </p>
          {filteredLocacoes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Truck size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs">Nenhum aluguel em aberto encontrado</p>
            </div>
          ) : filteredLocacoes.map(locacao => {
            const selected = isSelected(locacao.id!);
            const cliente = clientesMap.get(locacao.clienteId);
            return (
              <button
                type="button"
                key={locacao.id}
                onClick={() => toggleSelecao(locacao)}
                aria-pressed={selected}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selected ? 'bg-accent/10 border-accent/30' : 'bg-background border-border hover:border-accent/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    selected ? 'bg-accent border-accent' : 'border-muted-foreground/30'
                  }`}>
                    {selected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{cliente?.nome || 'Cliente não identificado'}</p>
                    <p className="text-xs text-muted-foreground truncate">{locacao.enderecoObra}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{locacao.status}</span>
                      <span className="text-[10px] text-muted-foreground">{locacao.quantidadeCacambas || 1} caçamba(s)</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
