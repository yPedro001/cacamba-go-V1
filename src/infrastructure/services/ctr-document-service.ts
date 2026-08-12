import { CTRPayload, CTRFormData, LocalDescarte } from '@/core/domain/ctr-types';
import { CTRPayloadSchema } from '@/core/domain/ctr-schemas';
import { Perfil } from '@/core/domain/types';

const LABELS_TIPO_OPERACAO: Record<string, string> = {
  coleta: 'Coleta',
  transporte: 'Transporte',
  transbordo: 'Transbordo',
  tratamento: 'Tratamento',
  destinacao_final: 'Destinação Final',
};

const LABELS_RESIDUO_CLASSE: Record<string, string> = {
  A: 'Classe A - Resíduos de construção civil',
  B: 'Classe B - Resíduos perigosos de outras fontes',
  C: 'Classe C - Resíduos que não podem ser reciclados',
  D: 'Classe D - Resíduos perigosos ( NCI )',
  E: 'Classe E - Resíduos radioativos',
  F: 'Classe F - Resíduos perigosos ( Ambientes服务业 )',
  Inerte: 'Classe Inerte - Resíduos que não se degradam',
};

const LABELS_TIPO_LOCAL: Record<string, string> = {
  aterro_sanitario: 'Aterro Sanitário',
  usina_reciclagem: 'Usina de Reciclagem',
  area_transbordo: 'Área de Transbordo',
  centro_tratamento: 'Centro de Tratamento',
  disposicao_final: 'Disposição Final',
  outro: 'Outro',
};

const LABELS_UNIDADE: Record<string, string> = {
  m3: 'm³',
  kg: 'kg',
  ton: 'ton',
  unidade: 'un',
  litros: 'L',
};

function formatCTRNumber(numero: string): string {
  if (!numero) return '-';
  if (numero.startsWith('FALLBACK-')) {
    // Extrai apenas o timestamp do FALLBACK
    const clean = numero.replace('FALLBACK-', '').split('-')[0];
    return `N°${clean}`;
  }
  return `N°${numero.padStart(7, '0')}`;
}

const PREFEITURA_LOGO_PATH = '/branding/prefeitura-taboao-da-serra.png';

function toTitleCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\w/g, c => c.toUpperCase());
}

export class CTRDocumentService {
  generatePayload(
    formData: CTRFormData,
    localDescarte: LocalDescarte,
    perfil: Perfil,
    numeroCTR: string
  ): CTRPayload {
    const nomeEmpresa = perfil.nomeEmpresa || '';
    
    const payload: CTRPayload = {
      identificacao: {
        numero: numeroCTR,
        data: this.formatDateBR(formData.data),
        horaSaida: formData.horaSaida,
        tipoOperacao: formData.tipoOperacao,
      },
      origem: {
        cep: formData.origem.cep || '',
        endereco: formData.origem.endereco,
        bairro: undefined,
        cidade: formData.origem.cidade,
        uf: formData.origem.uf as any,
        responsavel: formData.origem.responsavel || '',
        telefone: formData.origem.telefone || '',
        observacao: formData.origem.observacao || '',
      },
      gerador: {
        nome: formData.gerador.nome,
        cpfCnpj: formData.gerador.cpfCnpj,
        cep: formData.gerador.cep || '',
        endereco: formData.gerador.endereco || '',
        bairro: undefined,
        cidade: formData.gerador.cidade || '',
        uf: (formData.gerador.uf || 'SP') as any,
        responsavel: formData.gerador.responsavel || '',
        telefone: formData.gerador.telefone || '',
      },
      transportador: {
        nome: formData.transportador.nome,
        cpfCnpj: formData.transportador.cpfCnpj,
        inscricao: '',
        telefone: formData.transportador.telefone || '',
      },
      destinatario: {
        nome: formData.destinatario.nome || localDescarte.nome,
        cpfCnpj: formData.destinatario.cpfCnpj || localDescarte.cnpj || '',
        endereco: formData.destinatario.endereco || `${localDescarte.rua}${localDescarte.numero ? ', ' + localDescarte.numero : ''}`,
        bairro: undefined,
        cidade: formData.destinatario.cidade || localDescarte.cidade,
        uf: (formData.destinatario.uf || localDescarte.uf) as any,
        // Priorizar valor do formulário (edição manual) vs valor do local de descarte
        tipoLocal: formData.destinatario.tipoLocal || localDescarte.tipoLocal || 'outro',
        licenca: formData.destinatario.licenca || localDescarte.licenca || '',
      },
      residuo: {
        classe: formData.residuo.classe,
        descricao: formData.residuo.descricao,
        acondicionamento: formData.residuo.acondicionamento || '',
        quantidade: formData.residuo.quantidade,
        unidade: formData.residuo.unidade,
      },
      declaracoes: {
        transportador: {
          nome: formData.declaracoes.transportador.nome || formData.transportador.nome || '',
          assinatura: nomeEmpresa,
        },
        recebedor: {
          nome: formData.declaracoes.recebedor.nome,
          assinatura: formData.declaracoes.recebedor.assinatura,
          dataHora: formData.declaracoes.recebedor.dataHora,
          carimbo: formData.declaracoes.recebedor.carimbo,
          observacao: formData.declaracoes.recebedor.observacao,
        },
      },
      metadados: {
        empresa: {
          nome: perfil.nomeEmpresa,
          cnpj: perfil.cnpj || '',
          telefone: perfil.telefone || '',
          endereco: perfil.endereco || '',
          logoUrl: perfil.logoUrl || undefined,
        },
        emitidasEm: new Date().toLocaleString('pt-BR'),
        status: 'emitido',
      },
    };

    const validation = CTRPayloadSchema.safeParse(payload);
    if (!validation.success) {
      console.warn('Payload CTR com warnings:', validation.error.message);
    }

    return payload;
  }

  private getDocumentStyles(): string {
    return `
      @page {
        size: A4 portrait;
        margin: 14mm 12mm 12mm;
      }
      @page Section1 {
        size: 595.3pt 841.9pt;
        margin: 39.7pt 34pt 34pt 34pt;
        mso-header-margin: 0;
        mso-footer-margin: 0;
      }
      .Section1 { page: Section1; }
      @font-face {
        font-family: 'Playwrite Colombia Guides';
        src: url('/fonts/PlaywriteCOGuides-Regular.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; background: #fff; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 8.5px;
        line-height: 1.28;
        color: #1f2937;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .container { width: 100%; max-width: 680px; margin: 0 auto; }
      .header {
        text-align: center;
        margin-bottom: 7px;
        border-bottom: 1.5px solid #274c3b;
        padding: 2px 0 7px;
        page-break-inside: avoid;
      }
      .institutional-brand { display: flex; align-items: center; justify-content: center; min-height: 50px; margin-bottom: 5px; }
      .institutional-brand img { display: block; width: 235px; max-width: 68%; height: auto; max-height: 66px; object-fit: contain; }
      .institutional-name { display: none; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; }
      .header h1 { font-size: 12.5px; line-height: 1.2; margin-bottom: 3px; letter-spacing: 0.25px; color: #111827; }
      .header .subtitle { font-size: 9.5px; font-weight: bold; color: #4b5563; letter-spacing: 0.35px; }
      .section { margin-bottom: 6px; page-break-inside: avoid; }
      .section-title {
        font-size: 9px;
        line-height: 1.25;
        font-weight: bold;
        color: #17251f;
        background: #edf3f0;
        padding: 3px 5px;
        margin-bottom: 3px;
        border-left: 3px solid #274c3b;
        letter-spacing: 0.15px;
      }
      .grid { display: table; width: 100%; }
      .row { display: table-row; }
      .cell { display: table-cell; padding: 2px 4px; border-bottom: 1px solid #d8dee4; vertical-align: top; }
      .cell.label { font-weight: bold; width: 28%; color: #374151; background: #f8faf9; }
      .cell.value { width: 72%; }
      .cell.full { width: 100%; }
      .signature-area { margin-top: 10px; page-break-inside: avoid; }
      .signature-line { border-top: 1px solid #666; margin-top: 12px; padding-top: 2px; text-align: center; font-size: 7px; }
      .signature-grid { display: table; width: 100%; }
      .signature-cell { display: table-cell; width: 50%; text-align: center; padding: 3px; }
      .footer { margin-top: 9px; font-size: 7px; line-height: 1.35; color: #6b7280; text-align: center; border-top: 1px solid #cfd6d2; padding-top: 5px; page-break-inside: avoid; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #9ca8a2; padding: 3px 5px; text-align: left; font-size: 8.5px; line-height: 1.25; }
      th { background: #edf3f0; font-weight: bold; }
      .highlight { background: #fff9dd; }
      .signature-name { 
        font-family: 'Playwrite Colombia Guides', cursive; 
        font-size: 10px; 
        color: #1e3a5f; 
        text-align: center;
        margin-bottom: 2px;
        line-height: 1;
        letter-spacing: 0.5px;
        text-rendering: geometricPrecision;
        font-variant: normal;
        font-weight: normal;
      }
      /* Linha para assinatura manual */
      .signature-manual-line {
        border-top: 1px solid #999;
        width: 70%;
        margin: 10px auto 2px auto;
      }
      /* Container híbrido para assinatura digital + área manual */
      .signature-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        min-height: 30px;
      }
      @media print {
        html, body { width: 100%; }
        body { padding: 0; }
        .container { max-width: none; }
      }
    `;
  }

  private getDocumentBody(payload: CTRPayload, logoSrc: string = PREFEITURA_LOGO_PATH): string {
    const empresa = payload.metadados.empresa;
    const tipoOperacaoLabel = LABELS_TIPO_OPERACAO[payload.identificacao.tipoOperacao] || payload.identificacao.tipoOperacao;
    const classeLabel = payload.residuo.classe ? LABELS_RESIDUO_CLASSE[payload.residuo.classe] || payload.residuo.classe : '';
    const tipoLocalLabel = payload.destinatario.tipoLocal ? LABELS_TIPO_LOCAL[payload.destinatario.tipoLocal] || '' : '';
    const unidadeLabel = LABELS_UNIDADE[payload.residuo.unidade] || payload.residuo.unidade;
    const numeroFormatado = formatCTRNumber(payload.identificacao.numero);

    return `
    <div class="container">
      <div class="header">
        <div class="institutional-brand">
          <img src="${logoSrc}" alt="Prefeitura de Taboão da Serra" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
          <div class="institutional-name">PREFEITURA DE TABOÃO DA SERRA</div>
        </div>
        <h1>CONTROLE DE TRANSPORTE DE RESÍDUOS - CTR</h1>
        <div class="subtitle">${numeroFormatado}</div>
      </div>

      <table>
        <tr>
          <td style="width: 50%;"><strong>Data:</strong> ${payload.identificacao.data}</td>
          <td style="width: 25%;"><strong>Hora Saída:</strong> ${payload.identificacao.horaSaida}</td>
          <td style="width: 25%;"><strong>Operação:</strong> ${tipoOperacaoLabel}</td>
        </tr>
      </table>

      <div class="section">
        <div class="section-title">1. ORIGEM DO RESÍDUO</div>
        <div class="grid">
          ${payload.origem.cep ? `
          <div class="row">
            <div class="cell label">CEP:</div>
            <div class="cell value">${payload.origem.cep}</div>
          </div>
          ` : ''}
          <div class="row">
            <div class="cell label">Endereço:</div>
            <div class="cell value">${payload.origem.endereco}</div>
          </div>
          <div class="row">
            <div class="cell label">Cidade/UF:</div>
            <div class="cell value">${payload.origem.cidade} / ${payload.origem.uf}</div>
          </div>
          <div class="row">
            <div class="cell label">Responsável:</div>
            <div class="cell value">${payload.origem.responsavel || '-'}</div>
          </div>
          <div class="row">
            <div class="cell label">Telefone:</div>
            <div class="cell value">${payload.origem.telefone || '-'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">2. DADOS DO GERADOR</div>
        <div class="grid">
          <div class="row">
            <div class="cell label">Nome/Razão Social:</div>
            <div class="cell value">${payload.gerador.nome}</div>
          </div>
          <div class="row">
            <div class="cell label">CPF/CNPJ:</div>
            <div class="cell value">${payload.gerador.cpfCnpj}</div>
          </div>
          ${payload.gerador.cep ? `
          <div class="row">
            <div class="cell label">CEP:</div>
            <div class="cell value">${payload.gerador.cep}</div>
          </div>
          ` : ''}
          <div class="row">
            <div class="cell label">Endereço:</div>
            <div class="cell value">${payload.gerador.endereco || '-'}</div>
          </div>
          <div class="row">
            <div class="cell label">Cidade/UF:</div>
            <div class="cell value">${payload.gerador.cidade || '-'} / ${payload.gerador.uf || '-'}</div>
          </div>
          <div class="row">
            <div class="cell label">Responsável:</div>
            <div class="cell value">${payload.gerador.responsavel || '-'}</div>
          </div>
          <div class="row">
            <div class="cell label">Telefone:</div>
            <div class="cell value">${payload.gerador.telefone || '-'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. DADOS DO TRANSPORTADOR</div>
        <div class="grid">
          <div class="row">
            <div class="cell label">Empresa:</div>
            <div class="cell value">${payload.transportador.nome}</div>
          </div>
          <div class="row">
            <div class="cell label">CNPJ/CPF:</div>
            <div class="cell value">${payload.transportador.cpfCnpj}</div>
          </div>
          <div class="row">
            <div class="cell label">Telefone:</div>
            <div class="cell value">${payload.transportador.telefone || '-'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">4. DADOS DO DESTINATÁRIO (LOCAL DE DESCARTE)</div>
        <div class="grid">
          <div class="row">
            <div class="cell label">Nome/Razão Social:</div>
            <div class="cell value">${payload.destinatario.nome}</div>
          </div>
          <div class="row">
            <div class="cell label">CNPJ:</div>
            <div class="cell value">${payload.destinatario.cpfCnpj || '-'}</div>
          </div>
          <div class="row">
            <div class="cell label">Endereço:</div>
            <div class="cell value">${payload.destinatario.endereco}</div>
          </div>
          <div class="row">
            <div class="cell label">Cidade/UF:</div>
            <div class="cell value">${payload.destinatario.cidade} / ${payload.destinatario.uf}</div>
          </div>
          <div class="row">
            <div class="cell label">Tipo do Local:</div>
            <div class="cell value">${tipoLocalLabel}</div>
          </div>
          ${payload.destinatario.licenca ? `
          <div class="row">
            <div class="cell label">Licença Operacional:</div>
            <div class="cell value">${payload.destinatario.licenca}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">5. DESCRIÇÃO DO RESÍDUO</div>
        <div class="grid">
          <div class="row">
            <div class="cell label">Classe/Tipo:</div>
            <div class="cell value">${classeLabel}</div>
          </div>
          <div class="row">
            <div class="cell label">Descrição:</div>
            <div class="cell value">${payload.residuo.descricao}</div>
          </div>
          <div class="row">
            <div class="cell label">Acondicionamento:</div>
            <div class="cell value">${payload.residuo.acondicionamento || '-'}</div>
          </div>
          <div class="row">
            <div class="cell label">Quantidade:</div>
            <div class="cell value highlight"><strong>${payload.residuo.quantidade} ${unidadeLabel}</strong></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">6. DECLARAÇÕES E ASSINATURAS</div>
        <p style="margin-bottom: 15px; font-size: 10px;">
          Declaro que as informações acima são verídicas e que o transporte dos resíduos será realizado de acordo com as normas ambientais vigentes.
        </p>
        <div class="signature-area" style="margin-top: 25px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; text-align: center; padding: 10px; vertical-align: top;">
                <div class="signature-container">
                  <span class="signature-name">${toTitleCase(payload.declaracoes.transportador.assinatura || payload.metadados.empresa.nome)}</span>
                </div>
                <div style="border-top: 1px solid #999; padding-top: 8px; margin-top: 5px;">
                  <p style="font-size: 9px; font-weight: bold; margin: 0;">${payload.declaracoes.transportador.nome || '_________________'}</p>
                  <p style="font-size: 8px; color: #666; margin: 2px 0 0 0;">ASSINATURA DO TRANSPORTADOR</p>
                </div>
              </td>
              <td style="width: 50%; text-align: center; padding: 10px; vertical-align: bottom;">
                <div style="border-top: 1px solid #999; padding-top: 8px; min-height: 65px; display: flex; flex-direction: column; justify-content: flex-end;">
                  <p style="font-size: 9px; font-weight: bold; margin: 0;">${payload.declaracoes.recebedor.nome || '_________________'}</p>
                  <p style="font-size: 8px; color: #666; margin: 2px 0 0 0;">RECEBEDOR NO DESTINO</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="section">
        <table>
          <tr>
            <td style="width: 50%;">
              <strong>Data/Hora Recebimento:</strong><br>
              ${payload.declaracoes.recebedor.dataHora || '___/___/______  ___:___'}
            </td>
            <td style="width: 50%;">
              <strong>Carimbo/Observações:</strong><br>
              ${payload.declaracoes.recebedor.carimbo || ' '}<br>
              ${payload.declaracoes.recebedor.observacao || ' '}
            </td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>Documento gerado por ${empresa.nome} | CNPJ: ${empresa.cnpj || 'Não informado'} | Tel: ${empresa.telefone || 'Não informado'}</p>
        <p>Emitido em: ${payload.metadados.emitidasEm} | Status: ${payload.metadados.status.toUpperCase()}</p>
      </div>
    </div>`;
  }

  renderToHTML(payload: CTRPayload, logoSrc: string = PREFEITURA_LOGO_PATH): string {
    const numeroFormatado = formatCTRNumber(payload.identificacao.numero);
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CTR - ${numeroFormatado}</title>
  <style>${this.getDocumentStyles()}</style>
</head>
<body>
  ${this.getDocumentBody(payload, logoSrc)}
</body>
</html>`;
  }

  async generatePDF(payload: CTRPayload): Promise<Blob> {
    const html = this.renderToHTML(payload);

    // Isola o documento para que os estilos do CTR não afetem a aplicação
    // durante a captura e mantenham uma largura de renderização determinística.
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.left = '-10000px';
    frame.style.top = '0';
    frame.style.width = '720px';
    frame.style.height = '1100px';
    frame.style.border = '0';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    document.body.appendChild(frame);

    try {
      await new Promise<void>((resolve, reject) => {
        frame.addEventListener('load', () => resolve(), { once: true });
        frame.addEventListener('error', () => reject(new Error('Falha ao preparar o documento CTR')), { once: true });
        frame.srcdoc = html;
      });

      const frameDocument = frame.contentDocument;
      const container = frameDocument?.querySelector<HTMLElement>('.container');
      if (!frameDocument || !container) {
        throw new Error('Não foi possível renderizar o conteúdo do CTR');
      }

      const images = Array.from(frameDocument.querySelectorAll('img'));
      await Promise.all(images.map(image => image.complete
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          })
      ));
      if (frameDocument.fonts?.ready) await frameDocument.fonts.ready;

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 720,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const marginLeft = 12;
      const marginRight = 12;
      const marginTop = 14;
      const marginBottom = 12;
      const usableWidth = pdfWidth - marginLeft - marginRight;
      const usableHeight = pdfHeight - marginTop - marginBottom;
      const canvasRatio = canvas.height / canvas.width;
      
      let finalWidth = usableWidth;
      let finalHeight = usableWidth * canvasRatio;
      
      if (finalHeight > usableHeight) {
        finalHeight = usableHeight;
        finalWidth = usableHeight / canvasRatio;
      }
      
      const positionX = marginLeft + (usableWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'PNG', positionX, marginTop, finalWidth, finalHeight, undefined, 'FAST');

      return pdf.output('blob');
    } finally {
      frame.remove();
    }
  }

  private sanitizeFilename(name: string): string {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  private cleanNumeroForFilename(numero: string): string {
    if (!numero) return '0000000';
    if (numero.startsWith('FALLBACK-')) {
      return numero.replace('FALLBACK-', '').split('-')[0];
    }
    return numero.padStart(7, '0');
  }

  private generateCTRFilename(payload: CTRPayload, extension: string): string {
    const nomeCliente = this.sanitizeFilename(payload.gerador.nome || 'Cliente');
    const numeroLimpo = this.cleanNumeroForFilename(payload.identificacao.numero);
    // Formato: Pedro Oliveira-CTR-N°56776567
    return `${nomeCliente}-CTR-N°${numeroLimpo}.${extension}`;
  }

  async downloadPDF(payload: CTRPayload, _filename?: string): Promise<void> {
    const pdf = await this.generatePDF(payload);
    const url = URL.createObjectURL(pdf);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.generateCTRFilename(payload, 'pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async generateWord(payload: CTRPayload): Promise<Blob> {
    const styles = this.getDocumentStyles();
    const embeddedLogo = await this.getLogoDataUrl();
    
    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <meta name=ProgId content=Word.Document>
        <meta name=Generator content="Microsoft Word 15">
        <meta name=Originator content="Microsoft Word 15">
        <style>${styles}</style>
      </head>
      <body>
    `;
    
    const footer = `
      </body>
      </html>
    `;
    
    const bodyContent = this.getDocumentBody(payload, embeddedLogo);
    const fullHtml = `${header}<div class="Section1">${bodyContent}</div>${footer}`;
    
    const blob = new Blob([fullHtml], { 
      type: 'application/msword'
    });
    
    return blob;
  }

  async downloadWord(payload: CTRPayload, _filename?: string): Promise<void> {
    const doc = await this.generateWord(payload);
    const url = URL.createObjectURL(doc);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.generateCTRFilename(payload, 'doc');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async print(payload: CTRPayload): Promise<void> {
    const html = this.renderToHTML(payload);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Não foi possível abrir a janela de impressão');
    }

    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  }

  private async getLogoDataUrl(): Promise<string> {
    try {
      const response = await fetch(PREFEITURA_LOGO_PATH);
      if (!response.ok) return PREFEITURA_LOGO_PATH;
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return PREFEITURA_LOGO_PATH;
    }
  }

  private formatDateBR(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
}

export const ctrDocumentService = new CTRDocumentService();
