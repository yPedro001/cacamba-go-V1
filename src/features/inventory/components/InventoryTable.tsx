import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Cacamba } from "@/core/domain/types";
import { Edit2, History, Trash2, MapPin } from "lucide-react";

interface InventoryTableProps {
  cacambas: Cacamba[];
  onEdit: (c: Cacamba) => void;
  onShowHistory: (c: Cacamba) => void;
  onDelete: (id: string) => void;
}

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "success" | "info" | "warning" | "destructive" | "secondary" }
> = {
  disponivel: { label: "Disponível", variant: "success" },
  entrega_pendente: { label: "Entrega Pendente", variant: "info" },
  locada: { label: "Em Uso", variant: "warning" },
  vencida: { label: "Vencida", variant: "destructive" },
};

export function InventoryTable({
  cacambas,
  onEdit,
  onShowHistory,
  onDelete,
}: InventoryTableProps) {
  if (cacambas.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center text-muted-foreground">
        <p className="text-sm font-medium">Nenhuma caçamba cadastrada na frota.</p>
      </Card>
    );
  }

  return (
    <>
      {/* Cards mobile (< md) */}
      <div className="space-y-3 md:hidden">
        {cacambas.map((c) => {
          const st = STATUS_BADGE[c.status] || { label: c.status, variant: "secondary" as const };
          return (
            <Card key={c.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-foreground">
                      {c.codigo}
                    </span>
                    <Badge variant="outline" className="font-mono">
                      {c.tamanho}³
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1">{c.enderecoAtual || "Pátio Principal"}</span>
                  </p>
                </div>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onShowHistory(c)}
                  className="flex-1"
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  Histórico
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(c)}
                  aria-label={`Editar caçamba ${c.codigo}`}
                >
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(c.id)}
                  aria-label={`Excluir caçamba ${c.codigo}`}
                  className="text-status-danger-ink border-destructive/30 hover:bg-status-danger-bg"
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
              <TableHead className="font-semibold text-foreground">Código</TableHead>
              <TableHead className="font-semibold text-foreground">Tamanho</TableHead>
              <TableHead className="font-semibold text-foreground">Localização Atual</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cacambas.map((c) => {
              const st = STATUS_BADGE[c.status] || { label: c.status, variant: "secondary" as const };
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-foreground">{c.codigo}</TableCell>
                  <TableCell className="font-mono text-sm">{c.tamanho}³</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">
                    {c.enderecoAtual || "Pátio Principal"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onShowHistory(c)}
                        aria-label={`Ver histórico da caçamba ${c.codigo}`}
                      >
                        <History className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(c)}
                        aria-label={`Editar caçamba ${c.codigo}`}
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(c.id)}
                        aria-label={`Excluir caçamba ${c.codigo}`}
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
