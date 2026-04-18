"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CTRPayload } from '@/core/domain/ctr-types';
import { ctrDocumentService } from '@/infrastructure/services/ctr-document-service';
import { Printer, FileDown, FileText, Loader2 } from 'lucide-react';

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
  onPrint 
}: CTRDocumentPreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');

  // Gerar HTML quando o payload mudar
  React.useEffect(() => {
    if (payload) {
      try {
        const html = ctrDocumentService.renderToHTML(payload);
        setHtmlContent(html);
      } catch (err) {
        console.error('Erro ao gerar HTML do CTR:', err);
        setHtmlContent('');
      }
    }
  }, [payload]);

  const isReady = htmlContent.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => onDownloadPDF(payload)}
          variant="secondary"
          disabled={!isReady}
          className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider"
        >
          <FileDown size={16} className="mr-2" />
          Baixar PDF
        </Button>
        <Button
          onClick={() => onDownloadWord(payload)}
          variant="secondary"
          disabled={!isReady}
          className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider"
        >
          <FileText size={16} className="mr-2" />
          Baixar Word
        </Button>
        <Button
          onClick={() => onPrint(payload)}
          disabled={!isReady}
          className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider bg-accent hover:bg-accent-dark"
        >
          <Printer size={16} className="mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Container de visualização */}
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200 flex flex-col" style={{ minHeight: '600px', height: 'calc(100dvh - 340px)' }}>
        {!isReady ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
            <p className="text-sm text-muted-foreground">Gerando visualização...</p>
          </div>
        ) : (
          <iframe
            srcDoc={htmlContent}
            title="CTR Preview"
            className="w-full flex-1 min-h-[500px]"
            sandbox="allow-same-origin"
          />
        )}
      </div>

      {/* Info de ajuda */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Visualize o documento antes de baixar ou imprimir</p>
      </div>
    </div>
  );
}