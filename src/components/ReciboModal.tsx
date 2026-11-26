"use client";
import React, { useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Locacao, MetodoPagamento } from "@/core/domain/types";
import { useAppStore } from "@/store/useAppStore";
import {
  Printer,
  Share2,
  X,
  Download,
  Loader2,
  Copy,
  Check,
  FileText,
  Smartphone,
} from "lucide-react";
import { generatePixPayload } from "@/core/domain/pix-utils";
import {
  buildWhatsAppUrl,
  escapeHtml,
  formatLocalDateBR,
} from "@/lib/domain-helpers";
import { notify } from "@/lib/notificationService";
import { cn } from "@/lib/utils";

interface ReciboModalProps {
  locacao: Locacao;
  onClose: () => void;
}

const metodoPagamentoLabel: Record<MetodoPagamento, string> = {
  pix: "PIX",
  debito: "Cartão de Débito",
  credito: "Cartão de Crédito",
  boleto: "Boleto Bancário",
};

function mascaraDocumento(doc: string): string {
  if (!doc) return "—";
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return doc;
}

function buildDeterministicReceiptCode(locacao: Locacao): string {
  const seed = `${locacao.id || "0"}-${locacao.dataRetirada || ""}-${locacao.valor || 0}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `${(locacao.id || "REC").slice(-4).toUpperCase()}-${hash.toString(36).toUpperCase().padStart(6, "0")}`;
}

export function ReciboModal({ locacao, onClose }: ReciboModalProps) {
  const clientes = useAppStore((s) => s.clientes);
  const perfil = useAppStore((s) => s.perfil);
  const reciboRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"resumo" | "folha">("resumo");
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const cliente = clientes.find((c) => c.id === locacao.clienteId);
  const juros = locacao.jurosPercent || 0;
  const valorFinal = Number(((locacao.valor ?? 0) * (1 + juros / 100)).toFixed(2));
  const metodo = locacao.metodoPagamento;
  const qtd = locacao.quantidadeCacambas ?? 1;
  const dataEmissao = formatLocalDateBR(locacao.dataRetirada);
  const vencimento = formatLocalDateBR(locacao.dataDevolucaoPrevista);
  const isPago = locacao.status === "pago" || locacao.status === "concluida";

  const formatMoney = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pixPayload = useMemo(() => {
    if (metodo !== "pix" || isPago || !perfil.chavePix) return "";
    return generatePixPayload(perfil.chavePix, valorFinal, perfil.nomeEmpresa);
  }, [metodo, isPago, perfil.chavePix, perfil.nomeEmpresa, valorFinal]);

  const numeroRecibo = locacao.id ? locacao.id.slice(-8).toUpperCase() : "00000000";
  const hashVerificacao = buildDeterministicReceiptCode(locacao);

  const handleCopyPix = async () => {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopiedPix(true);
      notify.success("Código Pix Copia e Cola copiado!");
      setTimeout(() => setCopiedPix(false), 2500);
    } catch {
      notify.error("Não foi possível copiar o código Pix automaticamente.");
    }
  };

  const handlePrint = () => {
    const content = reciboRef.current?.innerHTML;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notify.error("Permita pop-ups para imprimir o recibo.");
      return;
    }
    printWindow.opener = null;

    const safeName = escapeHtml(cliente?.nome || "Cliente");
    const baseHref = window.location.origin;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <base href="${baseHref}/" />
          <title>Recibo #${escapeHtml(numeroRecibo)} - ${safeName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            @font-face {
              font-family: 'PlaywriteCOGuides';
              src: url('/fonts/PlaywriteCOGuides-Regular.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: block;
            }
            html, body { width: 100%; background: #ffffff !important; color: #0f172a !important; font-family: Arial, sans-serif; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 780px; margin: 0 auto;">${content}</div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.focus(); window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWhatsApp = () => {
    const texto = [
      `*RECIBO DE LOCAÇÃO - ${perfil.nomeEmpresa || "CaçambaGo"}*`,
      ``,
      `*Nº:* #${numeroRecibo}`,
      `*Cliente:* ${cliente?.nome || "Não identificado"}`,
      `*Endereço da Obra:* ${locacao.enderecoObra}`,
      `*Quantidade:* ${qtd} caçamba(s)`,
      `*Período:* ${dataEmissao} a ${vencimento}`,
      `*Valor:* R$ ${formatMoney(valorFinal)}`,
      metodo ? `*Pagamento:* ${metodoPagamentoLabel[metodo]}` : null,
      `*Status:* ${isPago ? "PAGO" : "PENDENTE"}`,
      pixPayload ? `\n*Pix Copia e Cola:*\n${pixPayload}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const url = buildWhatsAppUrl(cliente?.telefone, texto);
    if (!url) {
      notify.error("Cliente sem telefone válido para envio no WhatsApp.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadPDF = async () => {
    if (!reciboRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const source = reciboRef.current;
      const sandbox = document.createElement("div");
      sandbox.style.position = "fixed";
      sandbox.style.left = "-10000px";
      sandbox.style.top = "0";
      sandbox.style.width = "794px";
      sandbox.style.background = "#ffffff";
      sandbox.appendChild(source.cloneNode(true));
      document.body.appendChild(sandbox);

      try {
        const canvas = await html2canvas(sandbox.firstElementChild as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 794,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`recibo-${numeroRecibo}.pdf`);
        notify.success("PDF do recibo baixado.");
      } finally {
        sandbox.remove();
      }
    } catch (err) {
      console.error("Erro ao gerar PDF do recibo:", err);
      notify.error("Não foi possível gerar o PDF. Use a opção Imprimir.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end md:items-center justify-center bg-stone-950/75 backdrop-blur-[2px] p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Recibo ${numeroRecibo}`}
      onClick={onClose}
    >
      <div
        className="w-full md:w-[95vw] md:max-w-4xl h-[92dvh] md:h-[90vh] flex flex-col rounded-t-[20px] md:rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fixo */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 border-b border-border bg-card shrink-0">
          <div className="min-w-0">
            <h3 className="font-display text-base sm:text-lg font-bold text-foreground truncate">
              Recibo <span className="font-mono text-primary">#{numeroRecibo}</span>
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {cliente?.nome || "Cliente"} · R$ {formatMoney(valorFinal)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar recibo"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Seletor de visualização no mobile */}
        <div className="md:hidden grid grid-cols-2 gap-1.5 px-4 py-2 border-b border-border bg-muted/40 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("resumo")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-lg text-xs font-semibold transition-colors",
              mobileTab === "resumo"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
            Resumo / PIX
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("folha")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-lg text-xs font-semibold transition-colors",
              mobileTab === "folha"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Folha A4
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30">
          {/* Visão Resumo de Campo no Mobile */}
          {mobileTab === "resumo" && (
            <div className="md:hidden space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Valor Total
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2.5 py-0.5 text-xs font-bold",
                      isPago
                        ? "bg-status-success-bg text-status-success-ink"
                        : "bg-status-warning-bg text-status-warning-ink"
                    )}
                  >
                    {isPago ? "PAGO" : "PENDENTE"}
                  </span>
                </div>
                <p className="font-mono text-2xl font-bold text-foreground tabular-nums">
                  R$ {formatMoney(valorFinal)}
                </p>
                <div className="text-xs text-muted-foreground space-y-1 border-t border-border/60 pt-2.5">
                  <p>
                    <strong className="text-foreground">Cliente:</strong>{" "}
                    {cliente?.nome || "Não identificado"}
                  </p>
                  <p>
                    <strong className="text-foreground">Obra:</strong> {locacao.enderecoObra}
                  </p>
                  <p>
                    <strong className="text-foreground">Período:</strong> {dataEmissao} a{" "}
                    {vencimento}
                  </p>
                </div>
              </div>

              {pixPayload && (
                <div className="rounded-xl border border-border bg-card p-4 text-center space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pagamento instantâneo via PIX
                  </p>
                  <div className="inline-block rounded-xl bg-white p-3 border border-border">
                    <QRCodeSVG value={pixPayload} size={172} />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyPix}
                    className="w-full"
                  >
                    {copiedPix ? (
                      <Check className="h-4 w-4 text-status-success-ink" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {copiedPix ? "Código Pix Copiado!" : "Copiar Pix Copia e Cola"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Documento A4 Oficial (sempre montado para captura PDF/Impressão) */}
          <div
            className={cn(
              "overflow-x-auto",
              mobileTab === "resumo" ? "hidden md:block" : "block"
            )}
          >
            <div
              ref={reciboRef}
              className="mx-auto bg-white text-slate-900 shadow-lg w-[210mm] min-h-[297mm] p-[14mm] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
                  <div className="flex items-start gap-4">
                    {perfil.logoUrl && (
                      <img
                        src={perfil.logoUrl}
                        alt="Logo da empresa"
                        className="h-16 w-auto max-w-[140px] object-contain"
                      />
                    )}
                    <div className="space-y-1">
                      <h1 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
                        {perfil.nomeEmpresa || "CaçambaGo Locações"}
                      </h1>
                      {perfil.cnpj && (
                        <p className="text-xs text-slate-600 font-medium">
                          CNPJ: {mascaraDocumento(perfil.cnpj)}
                        </p>
                      )}
                      {perfil.endereco && (
                        <p className="text-xs text-slate-600">{perfil.endereco}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                        {perfil.telefone && <span>Tel: {perfil.telefone}</span>}
                        {perfil.email && <span>{perfil.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block border-2 border-slate-900 px-3 py-1 text-xs font-extrabold uppercase tracking-widest">
                      RECIBO DE LOCAÇÃO
                    </span>
                    <p className="font-mono text-sm font-bold text-slate-900 mt-1.5">
                      #{numeroRecibo}
                    </p>
                    <p className="text-[11px] text-slate-500">Emissão: {dataEmissao}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5 border border-slate-200 rounded-lg p-3.5 bg-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Dados do Cliente
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {cliente?.nome || "Não identificado"}
                    </p>
                    {cliente?.cpfCnpj && (
                      <p className="text-xs text-slate-600">
                        CPF/CNPJ: {mascaraDocumento(cliente.cpfCnpj)}
                      </p>
                    )}
                    {cliente?.telefone && (
                      <p className="text-xs text-slate-600">Tel: {cliente.telefone}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Local da Obra e Vigência
                    </p>
                    <p className="text-xs font-semibold text-slate-800">{locacao.enderecoObra}</p>
                    <p className="text-xs text-slate-600">
                      Retirada/Início: <strong>{dataEmissao}</strong>
                    </p>
                    <p className="text-xs text-slate-600">
                      Devolução Prevista: <strong>{vencimento}</strong>
                    </p>
                  </div>
                </div>

                <table className="w-full border-collapse border border-slate-300 text-xs mb-5">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="text-left p-2.5 font-bold uppercase tracking-wider">
                        Descrição do Serviço
                      </th>
                      <th className="text-center p-2.5 font-bold uppercase tracking-wider w-20">
                        Qtd.
                      </th>
                      <th className="text-right p-2.5 font-bold uppercase tracking-wider w-32">
                        Unitário
                      </th>
                      <th className="text-right p-2.5 font-bold uppercase tracking-wider w-32">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">
                          Locação de Caçamba Estacionária para Entulho
                        </p>
                        {locacao.observacoes && (
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Obs: {locacao.observacoes}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold">{qtd}</td>
                      <td className="p-3 text-right font-mono">
                        R$ {formatMoney(valorFinal / Math.max(1, qtd))}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        R$ {formatMoney(valorFinal)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-start gap-6 mb-6">
                  <div className="flex-1 border border-slate-200 rounded-lg p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Condições de Pagamento
                    </p>
                    <p className="text-xs text-slate-700">
                      <strong>Forma:</strong>{" "}
                      {metodo ? metodoPagamentoLabel[metodo] : "Não especificada"}
                      {metodo === "credito" && locacao.parcelas && locacao.parcelas > 1
                        ? ` (${locacao.parcelas}x)`
                        : ""}
                    </p>
                    <p className="text-xs text-slate-700 mt-1">
                      <strong>Situação:</strong>{" "}
                      <span
                        className={
                          isPago ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"
                        }
                      >
                        {isPago ? "QUITADO" : "AGUARDANDO PAGAMENTO"}
                      </span>
                    </p>
                  </div>

                  {pixPayload && (
                    <div className="flex items-center gap-3 border border-slate-300 rounded-lg p-3 bg-slate-50">
                      <QRCodeSVG value={pixPayload} size={84} />
                      <div className="text-[11px] text-slate-700 max-w-[160px]">
                        <p className="font-bold text-slate-900">Pague via PIX</p>
                        <p>Aponte a câmera do seu app bancário para o QR Code.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-300 pt-5 mt-8">
                <div className="grid grid-cols-2 gap-10 mb-6 text-center">
                  <div>
                    <div className="h-10 border-b border-slate-400" />
                    <p className="text-[11px] font-bold text-slate-700 mt-1.5">
                      {perfil.nomeEmpresa || "Empresa Locadora"}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">Responsável / Entrega</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-slate-400" />
                    <p className="text-[11px] font-bold text-slate-700 mt-1.5">
                      {cliente?.nome || "Cliente"}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">Assinatura do Cliente</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-200 pt-2">
                  <span>Documento não fiscal — Controle interno CaçambaGo</span>
                  <span className="font-mono">Ref.: {hashVerificacao}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com botões responsivos */}
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleWhatsApp}
            className="text-status-success-ink border-emerald-500/35 hover:bg-status-success-bg"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>WhatsApp</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Baixar PDF</span>
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>Imprimir</span>
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
