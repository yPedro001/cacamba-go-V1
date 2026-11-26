import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cliente } from "@/core/domain/types";
import { Edit2, Trash2, MapPin, MessageCircle, Phone } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/domain-helpers";

interface CustomerTableProps {
  clientes: Cliente[];
  onEdit: (c: Cliente) => void;
  onDelete: (id: string) => void;
}

export function CustomerTable({ clientes, onEdit, onDelete }: CustomerTableProps) {
  if (clientes.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center text-muted-foreground">
        <p className="text-sm font-medium">Nenhum cliente encontrado com o termo informado.</p>
      </Card>
    );
  }

  return (
    <>
      {/* Cards responsivos mobile (< md) */}
      <div className="space-y-3 md:hidden">
        {clientes.map((c) => {
          const waUrl = buildWhatsAppUrl(c.telefone);
          const addressCount = c.enderecos?.length || (c.endereco ? 1 : 0);
          const primaryAddr = c.enderecos?.[0]
            ? `${c.enderecos[0].rua}${c.enderecos[0].numero ? `, ${c.enderecos[0].numero}` : ""} · ${c.enderecos[0].cidade}`
            : c.endereco || "Sem endereço cadastrado";

          return (
            <Card key={c.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base text-foreground truncate">
                    {c?.nome || "Cliente"}
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground tabular-nums mt-0.5">
                    {c.cpfCnpj || "CPF/CNPJ não informado"}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {addressCount} {addressCount === 1 ? "local" : "locais"}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="line-clamp-2 text-foreground/85">{primaryAddr}</p>
                {c.email && <p className="truncate">{c.email}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                {waUrl ? (
                  <Button asChild variant="outline" size="sm" className="flex-1 min-w-[120px]">
                    <a href={waUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 text-status-success-ink" aria-hidden="true" />
                      WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="flex-1 min-w-[120px]">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Sem telefone
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(c)}
                  aria-label={`Editar cliente ${c.nome}`}
                >
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(c.id)}
                  aria-label={`Excluir cliente ${c.nome}`}
                  className="text-status-danger-ink hover:bg-status-danger-bg border-destructive/30"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tabela desktop (>= md) */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-foreground">Cliente / Razão Social</TableHead>
              <TableHead className="font-semibold text-foreground">Telefone / WhatsApp</TableHead>
              <TableHead className="font-semibold text-foreground">Endereços</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => {
              const waUrl = buildWhatsAppUrl(c.telefone);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{c?.nome || "Cliente"}</div>
                    <div className="text-xs font-mono text-muted-foreground tabular-nums">
                      {c.cpfCnpj || "Sem documento"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-status-success-ink hover:underline font-mono tabular-nums"
                      >
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {c.telefone}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem telefone</span>
                    )}
                    {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(c.enderecos || []).filter(Boolean).map((e) => (
                        <div key={e.id} className="text-xs flex items-center gap-1.5 text-foreground/90">
                          <MapPin className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                          <span className="font-semibold">{e.nome || "Local"}:</span>
                          <span className="truncate max-w-[260px]">
                            {e.rua}, {e.numero} · {e.cidade}
                          </span>
                        </div>
                      ))}
                      {(!c.enderecos || c.enderecos.length === 0) && c.endereco && (
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {c.endereco}
                        </div>
                      )}
                      {(!c.enderecos || c.enderecos.length === 0) && !c.endereco && (
                        <span className="text-xs text-muted-foreground">Sem endereço cadastrado</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(c)}
                        aria-label={`Editar cliente ${c.nome}`}
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(c.id)}
                        aria-label={`Excluir cliente ${c.nome}`}
                        className="text-status-danger-ink hover:bg-status-danger-bg"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
