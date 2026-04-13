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

export class CTRDocumentService {
  generatePayload(
    formData: CTRFormData,
    localDescarte: LocalDescarte,
    perfil: Perfil,
    numeroCTR: string
  ): CTRPayload {
    // Gerar assinatura automática do transportador baseada no nome da empresa
    const assinaturaTransportador = perfil.nomeEmpresa || formData.transportador.nome || '';
    
    const payload: CTRPayload = {
      identificacao: {
        numero: numeroCTR,
        data: this.formatDateBR(formData.data),
        horaSaida: formData.horaSaida,
        tipoOperacao: formData.tipoOperacao,
      },
      origem: {
        endereco: formData.origem.endereco,
        bairro: formData.origem.bairro || '',
        cidade: formData.origem.cidade,
        uf: formData.origem.uf as any,
        responsavel: formData.origem.responsavel || '',
        telefone: formData.origem.telefone || '',
        observacao: formData.origem.observacao || '',
      },
      gerador: {
        nome: formData.gerador.nome,
        cpfCnpj: formData.gerador.cpfCnpj,
        endereco: formData.gerador.endereco || '',
        bairro: formData.gerador.bairro || '',
        cidade: formData.gerador.cidade || '',
        uf: (formData.gerador.uf || 'SP') as any,
        responsavel: formData.gerador.responsavel || '',
        telefone: formData.gerador.telefone || '',
      },
      transportador: {
        nome: formData.transportador.nome,
        cpfCnpj: formData.transportador.cpfCnpj,
        inscricao: formData.transportador.inscricao || '',
        telefone: formData.transportador.telefone || '',
      },
      destinatario: {
        nome: localDescarte.nome,
        cpfCnpj: localDescarte.cnpj || '',
        endereco: `${localDescarte.rua}${localDescarte.numero ? ', ' + localDescarte.numero : ''}`,
        bairro: localDescarte.bairro || '',
        cidade: localDescarte.cidade,
        uf: localDescarte.uf as any,
        tipoLocal: localDescarte.tipoLocal,
        licenca: localDescarte.licenca || '',
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
          assinatura: assinaturaTransportador,
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

  renderToHTML(payload: CTRPayload): string {
    const empresa = payload.metadados.empresa;
    const tipoOperacaoLabel = LABELS_TIPO_OPERACAO[payload.identificacao.tipoOperacao] || payload.identificacao.tipoOperacao;
    const classeLabel = payload.residuo.classe ? LABELS_RESIDUO_CLASSE[payload.residuo.classe] || payload.residuo.classe : '';
    const tipoLocalLabel = payload.destinatario.tipoLocal ? LABELS_TIPO_LOCAL[payload.destinatario.tipoLocal] || '' : '';
    const unidadeLabel = LABELS_UNIDADE[payload.residuo.unidade] || payload.residuo.unidade;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CTR - ${payload.identificacao.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #333; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
    .header h1 { font-size: 18px; margin-bottom: 5px; }
    .header .subtitle { font-size: 12px; color: #666; }
    .section { margin-bottom: 15px; }
    .section-title { font-size: 12px; font-weight: bold; background: #f0f0f0; padding: 5px 10px; margin-bottom: 8px; border-left: 3px solid #333; }
    .grid { display: table; width: 100%; }
    .row { display: table-row; }
    .cell { display: table-cell; padding: 4px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
    .cell.label { font-weight: bold; width: 35%; background: #fafafa; }
    .cell.value { width: 65%; }
    .cell.full { width: 100%; }
    .signature-area { margin-top: 30px; page-break-inside: avoid; }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; text-align: center; font-size: 10px; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
    .signature-cell { display: table-cell; width: 33.33%; text-align: center; padding: 10px; }
    .footer { margin-top: 30px; font-size: 9px; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 10px; }
    th { background: #f0f0f0; font-weight: bold; }
    .highlight { background: #fffde7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CONTROLE DE TRANSPORTE DE RESÍDUOS - CTR</h1>
      <div class="subtitle">Nº ${payload.identificacao.numero}</div>
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
        <div class="row">
          <div class="cell label">Endereço:</div>
          <div class="cell value">${payload.origem.endereco}</div>
        </div>
        <div class="row">
          <div class="cell label">Bairro:</div>
          <div class="cell value">${payload.origem.bairro || '-'}</div>
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
          <div class="cell label">Inscrição Estadual:</div>
          <div class="cell value">${payload.transportador.inscricao || '-'}</div>
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
          <div class="cell label">Bairro:</div>
          <div class="cell value">${payload.destinatario.bairro || '-'}</div>
        </div>
        <div class="row">
          <div class="cell label">Cidade/UF:</div>
          <div class="cell value">${payload.destinatario.cidade} / ${payload.destinatario.uf}</div>
        </div>
        <div class="row">
          <div class="cell label">Tipo do Local:</div>
          <div class="cell value">${tipoLocalLabel}</div>
        </div>
        <div class="row">
          <div class="cell label">Licença/Cadastro:</div>
          <div class="cell value">${payload.destinatario.licenca || '-'}</div>
        </div>
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
            <td style="width: 50%; text-align: center; padding: 15px; vertical-align: top;">
              <!-- Assinatura do Transportador com mesmo estilo do Recibo -->
              <div style="position: relative; width: 280px; margin: 0 auto 10px auto;">
                <svg width="280" height="80" viewBox="0 0 280 80" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                    </style>
                  </defs>
                  <g fill="none" stroke="#000080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 65 C80 55 200 45 260 35" opacity="0.06" />
                  </g>
                  <text
                    x="50%"
                    y="50"
                    textAnchor="middle"
                    fontFamily="'Dancing Script', cursive"
                    fontSize="36"
                    fontWeight="700"
                    fill="#1e3a5f"
                    stroke="none"
                  >${payload.declaracoes.transportador.assinatura || payload.metadados.empresa.nome}</text>
                </svg>
              </div>
              <div style="border-top: 1px solid #333; padding-top: 8px; margin-top: 5px;">
                <p style="font-size: 9px; font-weight: bold; margin: 0;">${payload.declaracoes.transportador.nome || '_________________'}</p>
                <p style="font-size: 8px; color: #666; margin: 2px 0 0 0;">ASSINATURA DO TRANSPORTADOR</p>
              </div>
            </td>
            <td style="width: 50%; text-align: center; padding: 15px; vertical-align: top;">
              <div style="border-top: 1px solid #333; padding-top: 8px;">
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
  </div>
</body>
</html>`;
  }

  async generatePDF(payload: CTRPayload): Promise<Blob> {
    const html = this.renderToHTML(payload);
    
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = 'white';
    document.body.appendChild(container);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasRatio = canvas.height / canvas.width;
      
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth * canvasRatio;
      
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight / canvasRatio;
      }
      
      const marginX = (pdfWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'PNG', marginX, 0, finalWidth, finalHeight, undefined, 'FAST');

      return pdf.output('blob');
    } finally {
      document.body.removeChild(container);
    }
  }

  private sanitizeFilename(name: string): string {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  private generateCTRFilename(payload: CTRPayload, extension: string): string {
    const nomeCliente = this.sanitizeFilename(payload.gerador.nome || 'Cliente');
    return `CTR-N°${payload.identificacao.numero}-${nomeCliente}.${extension}`;
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
    const html = this.renderToHTML(payload);
    
    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <meta name=ProgId content=Word.Document>
        <meta name=Generator content="Microsoft Word 15">
        <meta name=Originator content="Microsoft Word 15">
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #333; padding: 4px; }
          .header { text-align: center; margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; background: #f0f0f0; padding: 5px; }
        </style>
      </head>
      <body>
    `;
    
    const footer = `
      </body>
      </html>
    `;
    
    const fullHtml = header + html.replace(/<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>/g, '').replace(/<style>[\s\S]*<\/style>/g, '') + footer;
    
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <title>CTR - ${payload.identificacao.numero}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; background: #f0f0f0; padding: 5px; }
          table { width: 100%; border-collapse: collapse; }
          td, th { border: 1px solid #333; padding: 4px; }
          .signature-area { margin-top: 30px; }
          .signature-grid { display: table; width: 100%; }
          .signature-cell { display: table-cell; width: 33.33%; text-align: center; padding: 10px; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
        </style>
      </head>
      <body>
        ${html.replace(/<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>|<style>[\s\S]*<\/style>/g, '')}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  private formatDateBR(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
}

export const ctrDocumentService = new CTRDocumentService();
