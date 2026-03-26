import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Interface para os dados de exportação
 */
export interface ExportData {
  title: string;
  filename: string;
  headers: string[];
  data: any[][];
  logoText?: string;
}

/**
 * ExportService: Centraliza a geração de documentos profissionais.
 */
class ExportService {
  private primaryColor = '#FACC15'; // Amarelo CaçambaGo
  private secondaryColor = '#1E293B'; // Slate-800

  /**
   * Exporta os dados para um PDF profissional
   */
  exportPDF({ title, filename, headers, data }: ExportData) {
    const doc = new jsPDF();
    const date = new Date().toLocaleString('pt-BR');

    // 1. Cabeçalho (Logo Simbolizada)
    doc.setFillColor(this.primaryColor);
    doc.rect(10, 10, 15, 15, 'F'); // Ícone estilizado
    doc.setTextColor(this.secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Caçamba', 28, 18);
    doc.setTextColor(this.primaryColor);
    doc.text('Go', 62, 18); // Ajuste fino no posicionamento

    // 2. Título e Data
    doc.setTextColor(this.secondaryColor);
    doc.setFontSize(16);
    doc.text(title, 10, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Gerado em: ${date}`, 10, 48);
    doc.line(10, 50, 200, 50);

    // 3. Tabela de Conteúdo
    autoTable(doc, {
      startY: 55,
      head: [headers],
      body: data,
      theme: 'striped',
      headStyles: { 
        fillColor: [250, 204, 21], 
        textColor: [30, 41, 59],
        fontSize: 11,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 30 },
      didDrawPage: (data) => {
        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${data.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        doc.text('© 2026 CaçambaGo - Gestão Profissional de Resíduos', 10, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`${filename}.pdf`);
  }

  /**
   * Exporta os dados para uma planilha Excel estruturada
   */
  exportExcel({ title, filename, headers, data }: ExportData) {
    // 1. Prepara os dados (Cabeçalho + Body)
    const worksheetData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 2. Estilização Básica (SheetJS Community possui limites de estilo sem plugins extras, 
    // mas configuramos largura e filtros)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Auto-filtro
    ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };

    // Largura das colunas sugerida
    const colWidths = headers.map((_, i) => {
      let maxLen = headers[i].length;
      data.forEach(row => {
        const val = row[i]?.toString() || '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: maxLen + 5 };
    });
    ws['!cols'] = colWidths;

    // Congelar cabeçalho (View option)
    ws['!views'] = [{ state: 'frozen', ySplit: 1 }];

    // 3. Gerar Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));

    // 4. Salvar
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

export const exportService = new ExportService();
