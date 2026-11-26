"use client";
import React, { useEffect, useRef, useState } from "react";
import { CTRPayload } from "@/core/domain/ctr-types";
import { ctrDocumentService } from "@/infrastructure/services/ctr-document-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, FileText, Printer } from "lucide-react";

interface CTRDocumentPreviewProps {
  payload: CTRPayload;
  onDownloadPDF: (payload: CTRPayload) => void;
  onDownloadWord: (payload: CTRPayload) => void;
  onPrint: (payload: CTRPayload) => void;
}

export function CTRDocumentPreview({
  payload,
  onDownloadPDF,
  onDownloadWord,
  onPrint,
}: CTRDocumentPreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    if (!payload) return;
    try {
      setHtmlContent(ctrDocumentService.renderToHTML(payload));
    } catch (err) {
      console.error("Erro ao gerar preview:", err);
    }
  }, [payload]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const updateScale = () => {
      const avail = el.clientWidth;
      if (avail > 0) {
        setScale(Math.min(1, avail / 720));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!payload) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Preencha os dados para visualizar o documento CTR oficial.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-3.5 sm:px-5 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          Pré-visualização Oficial A4
        </CardTitle>

        <div className="grid grid-cols-1 min-[380px]:grid-cols-3 sm:flex gap-2">
          <Button type="button" size="sm" onClick={() => onDownloadPDF(payload)}>
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onDownloadWord(payload)}>
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Word
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onPrint(payload)}>
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 bg-muted/40">
        <div ref={containerRef} className="w-full overflow-hidden rounded-lg border border-border bg-white">
          <div
            style={{
              width: 720,
              height: Math.round(1010 * scale),
              overflow: "hidden",
            }}
          >
            <iframe
              srcDoc={htmlContent}
              title="Preview CTR Oficial"
              style={{
                width: 720,
                height: 1010,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              className="border-0 bg-white block"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
