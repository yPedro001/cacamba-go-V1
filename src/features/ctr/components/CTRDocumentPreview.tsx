"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CTRPayload } from '@/core/domain/ctr-types';
import { ctrDocumentService } from '@/infrastructure/services/ctr-document-service';
import { Printer, FileDown, FileText } from 'lucide-react';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(ctrDocumentService.renderToHTML(payload));
        doc.close();
      }
    }
    setIframeKey(prev => prev + 1);
  }, [payload]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => onDownloadPDF(payload)}
          variant="secondary"
          className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider"
        >
          <FileDown size={16} className="mr-2" />
          Baixar PDF
        </Button>
        <Button
          onClick={() => onDownloadWord(payload)}
          variant="secondary"
          className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider"
        >
          <FileText size={16} className="mr-2" />
          Baixar Word
        </Button>
        <Button
          onClick={() => onPrint(payload)}
          className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider bg-accent hover:bg-accent-dark"
        >
          <Printer size={16} className="mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          className="w-full h-[600px]"
          title="CTR Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
