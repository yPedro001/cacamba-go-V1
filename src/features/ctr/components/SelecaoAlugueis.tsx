"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cliente, Locacao } from "@/core/domain/types";
import { AlertTriangle, Check, Search, Truck, UserRound } from "lucide-react";
import { useClientes } from "@/store/useAppStore";
import { formatLocalDateBR } from "@/lib/domain-helpers";
import { cn } from "@/lib/utils";

interface SelecaoAlugueisProps {
  locacoes: Locacao[];
  selecionados: Locacao[];
  clienteSelecionado: Cliente | null;
  onSelecionar: (locacoes: Locacao[]) => void;
  onSelecionarCliente: (cliente: Cliente) => void;
}

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function SelecaoAlugueis({
  locacoes,
  selecionados,
  clienteSelecionado,
  onSelecionar,
  onSelecionarCliente,
}: SelecaoAlugueisProps) {
  const clientes = useClientes();
  const [search, setSearch] = useState("");
  const normalizedSearch = normalizeSearch(search);

  const clientesMap = useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente])),
    [clientes]
  );

  const filteredClientes = useMemo(
    () =>
      clientes.filter((cliente) => {
        const enderecos =
          cliente.enderecos
            ?.map(
              (endereco) =>
                `${endereco.nome} ${endereco.rua} ${endereco.numero} ${endereco.cidade} ${endereco.cep || ""}`
            )
            .join(" ") || "";
        const searchable = normalizeSearch(
          [
            cliente.nome,
            cliente.cpfCnpj,
            cliente.telefone,
            cliente.email,
            cliente.endereco,
            enderecos,
          ]
            .filter(Boolean)
            .join(" ")
        );
        return !normalizedSearch || searchable.includes(normalizedSearch);
      }),
    [clientes, normalizedSearch]
  );

  const filteredLocacoes = useMemo(
    () =>
      locacoes.filter((locacao) => {
        const cliente = clientesMap.get(locacao.clienteId);
        const searchable = normalizeSearch(
          [
            locacao.enderecoObra,
            cliente?.nome,
            cliente?.cpfCnpj,
            cliente?.telefone,
            locacao.id,
          ]
            .filter(Boolean)
            .join(" ")
        );
        return !normalizedSearch || searchable.includes(normalizedSearch);
      }),
    [clientesMap, locacoes, normalizedSearch]
  );

  const dadosAusentes = useMemo(() => {
    if (!clienteSelecionado) return [];
    const possuiEndereco = Boolean(
      clienteSelecionado.endereco?.trim() || clienteSelecionado.enderecos?.length
    );
    const possuiContato = Boolean(
      clienteSelecionado.telefone?.trim() || clienteSelecionado.email?.trim()
    );
    return [
      !possuiEndereco ? "endereço" : null,
      !possuiContato ? "telefone ou e-mail" : null,
    ].filter((item): item is string => Boolean(item));
  }, [clienteSelecionado]);

  const isSelected = (id: string) => selecionados.some((locacao) => locacao.id === id);

  const toggleSelecao = (locacao: Locacao) => {
    if (isSelected(locacao.id!)) {
      onSelecionar(selecionados.filter((item) => item.id !== locacao.id));
    } else {
      onSelecionar([...selecionados, locacao]);
    }
  };

  // Seleciona automaticamente apenas os aluguéis compatíveis (mesmo cliente) para evitar falso conflito imediato
  const handleSelecionarTodosDoCliente = () => {
    const targetClientId =
      selecionados[0]?.clienteId ||
      clienteSelecionado?.id ||
      filteredLocacoes[0]?.clienteId;
    if (!targetClientId) return;
    onSelecionar(filteredLocacoes.filter((l) => l.clienteId === targetClientId));
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3.5 sm:px-5 border-b border-border bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            1. Cliente e Locações
          </CardTitle>
          <div className="flex gap-1.5">
            {filteredLocacoes.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelecionarTodosDoCliente}
              >
                Selecionar mesmo cliente
              </Button>
            )}
            {selecionados.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onSelecionar([])}>
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar cliente, CPF/CNPJ, telefone ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Clientes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Emitir direto por cliente ({filteredClientes.length})
            </p>
            {clienteSelecionado && <Badge variant="default">Selecionado</Badge>}
          </div>

          {filteredClientes.length === 0 ? (
            <div className="p-3.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              Nenhum cliente encontrado com essa busca.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredClientes.map((cliente) => {
                const selected = clienteSelecionado?.id === cliente.id;
                const enderecoResumo = cliente.enderecos?.[0]
                  ? `${cliente.enderecos[0].rua}${cliente.enderecos[0].numero ? `, ${cliente.enderecos[0].numero}` : ""} - ${cliente.enderecos[0].cidade}`
                  : cliente.endereco || "Sem endereço cadastrado";

                return (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => onSelecionarCliente(cliente)}
                    className={cn(
                      "w-full text-left p-3 min-h-[56px] rounded-xl border transition-colors flex items-center justify-between gap-3",
                      selected
                        ? "bg-primary/10 border-primary/50"
                        : "bg-background/60 border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {cliente.nome}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        <span className="font-mono">{cliente.cpfCnpj || "Sem CPF/CNPJ"}</span> ·{" "}
                        {enderecoResumo}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "h-5 w-5 rounded-md border flex items-center justify-center shrink-0",
                        selected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {dadosAusentes.length > 0 && (
            <div className="p-3 rounded-xl bg-status-warning-bg border border-amber-500/30 flex items-start gap-2.5 text-xs text-status-warning-ink">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Cliente sem {dadosAusentes.join(" e ")}. Complete os dados manualmente nos blocos do formulário ao lado.
              </span>
            </div>
          )}
        </div>

        {/* Locações vinculáveis */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Vincular a locação(ões) ({filteredLocacoes.length})
            </p>
            {selecionados.length > 0 && (
              <Badge variant="default">{selecionados.length} marcada(s)</Badge>
            )}
          </div>

          {filteredLocacoes.length === 0 ? (
            <div className="p-4 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              Nenhuma locação disponível para vínculo.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredLocacoes.map((locacao) => {
                const cliente = clientesMap.get(locacao.clienteId);
                const selected = isSelected(locacao.id!);
                return (
                  <button
                    key={locacao.id}
                    type="button"
                    onClick={() => toggleSelecao(locacao)}
                    className={cn(
                      "w-full text-left p-3 min-h-[56px] rounded-xl border transition-colors flex items-center justify-between gap-3",
                      selected
                        ? "bg-primary/10 border-primary/50"
                        : "bg-background/60 border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {cliente?.nome || "Cliente não encontrado"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {locacao.quantidadeCacambas || 1}x caçamba
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {locacao.enderecoObra || "Endereço não informado"} ·{" "}
                        {formatLocalDateBR(locacao.dataRetirada)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "h-5 w-5 rounded-md border flex items-center justify-center shrink-0",
                        selected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
