import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Locacao, Cliente } from "@/core/domain/types";
import {
  CheckCircle,
  MessageSquare,
  FileDown,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Truck,
} from "lucide-react";
import { buildWhatsAppUrl, formatLocalDateBR } from "@/lib/domain-helpers";
import { formatBRL } from "@/lib/business-utils";
import { cn } from "@/lib/utils";

interface RentalsSummaryProps {
  inadimplentes: Locacao[];
  vencidos: Locacao[];
  pendentesEntrega: Locacao[];
  clientes?: Cliente[];
  getClientName: (id: string) => string;
  onMarkConcluida: (id: string) => void;
  onMarkEmUso: (id: string) => void;
  onExportPDF: (list: Locacao[], title: string) => void;
  onExportExcel: (list: Locacao[], title: string) => void;
}

type MobileTab = "entregas" | "vencidos" | "inadimplentes";

export function RentalsSummary({
  inadimplentes,
  vencidos,
  pendentesEntrega,
  clientes = [],
  getClientName,
  onMarkConcluida,
  onMarkEmUso,
  onExportPDF,
  onExportExcel,
}: RentalsSummaryProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("entregas");

  const getClientPhone = (clienteId: string) =>
    clientes.find((c) => c.id === clienteId)?.telefone;

  const renderInadimplentesCard = () => (
    <Card className="border-destructive/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 text-status-danger-ink shrink-0" aria-hidden="true" />
          <CardTitle className="text-sm sm:text-base truncate">
            Inadimplentes ({inadimplentes.length})
          </CardTitle>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            onClick={() => onExportPDF(inadimplentes, "Relatório de Inadimplência")}
            variant="ghost"
            size="sm"
            aria-label="Exportar inadimplentes em PDF"
            className="h-9 px-2 text-xs font-semibold"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            PDF
          </Button>
          <Button
            type="button"
            onClick={() => onExportExcel(inadimplentes, "Inadimplência")}
            variant="ghost"
            size="sm"
            aria-label="Exportar inadimplentes em Excel"
            className="h-9 px-2 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            XLS
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-2 md:max-h-[300px] md:overflow-y-auto">
        {inadimplentes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum contrato inadimplente.
          </p>
        ) : (
          inadimplentes.map((l) => {
            const clientName = getClientName(l.clienteId);
            const waMsg = `Olá ${clientName}, identificamos uma pendência referente à locação em ${l.enderecoObra} no valor de ${formatBRL(l.valor)}. Podemos ajudar com o pagamento ou renovação?`;
            const waUrl = buildWhatsAppUrl(getClientPhone(l.clienteId), waMsg);

            return (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/50 p-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{clientName}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatBRL(l.valor)} · Prev.: {formatLocalDateBR(l.dataDevolucaoPrevista)}
                  </p>
                </div>
                {waUrl ? (
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Cobrar ${clientName} no WhatsApp`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-status-success-ink" aria-hidden="true" />
                      Cobrar
                    </a>
                  </Button>
                ) : (
                  <Badge variant="outline">Sem fone</Badge>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );

  const renderVencidosCard = () => (
    <Card className="border-amber-500/35">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 text-status-warning-ink shrink-0" aria-hidden="true" />
          <CardTitle className="text-sm sm:text-base truncate">
            Retirada Pendente ({vencidos.length})
          </CardTitle>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            onClick={() => onExportPDF(vencidos, "Relatório de Retiradas Pendentes")}
            variant="ghost"
            size="sm"
            aria-label="Exportar retiradas pendentes em PDF"
            className="h-9 px-2 text-xs font-semibold"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            PDF
          </Button>
          <Button
            type="button"
            onClick={() => onExportExcel(vencidos, "Retiradas")}
            variant="ghost"
            size="sm"
            aria-label="Exportar retiradas pendentes em Excel"
            className="h-9 px-2 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            XLS
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-2 md:max-h-[300px] md:overflow-y-auto">
        {vencidos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma caçamba vencida para retirada.
          </p>
        ) : (
          vencidos.map((l) => (
            <div
              key={l.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-background/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">
                  {l.quantidadeCacambas}x caçamba — {getClientName(l.clienteId)}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">{l.enderecoObra}</p>
              </div>
              <Button
                type="button"
                onClick={() => onMarkConcluida(l.id!)}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto shrink-0"
              >
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Concluir
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderPendentesEntregaCard = () => (
    <Card className="border-blue-500/35">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <Truck className="h-4 w-4 text-status-info-ink shrink-0" aria-hidden="true" />
          <CardTitle className="text-sm sm:text-base truncate">
            Aguardando Entrega ({pendentesEntrega.length})
          </CardTitle>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            onClick={() => onExportPDF(pendentesEntrega, "Relatório de Entregas Pendentes")}
            variant="ghost"
            size="sm"
            aria-label="Exportar entregas pendentes em PDF"
            className="h-9 px-2 text-xs font-semibold"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            PDF
          </Button>
          <Button
            type="button"
            onClick={() => onExportExcel(pendentesEntrega, "Entregas")}
            variant="ghost"
            size="sm"
            aria-label="Exportar entregas pendentes em Excel"
            className="h-9 px-2 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            XLS
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-2 md:max-h-[300px] md:overflow-y-auto">
        {pendentesEntrega.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma entrega pendente.
          </p>
        ) : (
          pendentesEntrega.map((l) => (
            <div
              key={l.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-background/50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">
                  {l.quantidadeCacambas}x caçamba — {getClientName(l.clienteId)}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">{l.enderecoObra}</p>
              </div>
              <Button
                type="button"
                onClick={() => onMarkEmUso(l.id!)}
                size="sm"
                className="w-full sm:w-auto shrink-0"
              >
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Confirmar Entrega
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-3">
      {/* Navegação por abas segmentadas no mobile */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-muted p-1 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("entregas")}
          className={cn(
            "min-h-[42px] rounded-lg px-2 text-xs font-semibold whitespace-nowrap transition-colors",
            mobileTab === "entregas"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Entregar ({pendentesEntrega.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("vencidos")}
          className={cn(
            "min-h-[42px] rounded-lg px-2 text-xs font-semibold whitespace-nowrap transition-colors",
            mobileTab === "vencidos"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Retirar ({vencidos.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("inadimplentes")}
          className={cn(
            "min-h-[42px] rounded-lg px-2 text-xs font-semibold whitespace-nowrap transition-colors",
            mobileTab === "inadimplentes"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Cobrar ({inadimplentes.length})
        </button>
      </div>

      <div className="md:hidden">
        {mobileTab === "entregas" && renderPendentesEntregaCard()}
        {mobileTab === "vencidos" && renderVencidosCard()}
        {mobileTab === "inadimplentes" && renderInadimplentesCard()}
      </div>

      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderInadimplentesCard()}
        {renderVencidosCard()}
        {renderPendentesEntregaCard()}
      </div>
    </div>
  );
}
