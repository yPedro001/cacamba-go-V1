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
 *
 * Dependências:
 * - PDF: jsPDF + jspdf-autotable
 * - Excel: ExcelJS (substitui xlsx que possuía vulnerabilidades CVE-2023 conhecidas)
 */
class ExportService {
  private primaryColor = '#FACC15'; // Amarelo CaçambaGo
  private secondaryColor = '#1E293B'; // Slate-800

  /**
   * Exporta os dados para um PDF profissional
   */
  async exportPDF({ title, filename, headers, data }: ExportData): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
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
    doc.text('Go', 62, 18);

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
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { top: 30 },
      didDrawPage: (pageData) => {
        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${pageData.pageNumber}`,
          doc.internal.pageSize.width - 25,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          '© 2026 CaçambaGo - Gestão Profissional de Resíduos',
          10,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`${filename}.pdf`);
  }

  /**
   * Exporta os dados para uma planilha Excel estruturada (.xlsx)
   * Utiliza ExcelJS — biblioteca ativa e sem vulnerabilidades conhecidas.
   */
  async exportExcel({ title, filename, headers, data }: ExportData): Promise<void> {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CaçambaGo';
    workbook.created = new Date();

    const sheetName = title.slice(0, 31); // Excel limita nome do sheet a 31 chars
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }], // Congela cabeçalho
    });

    // --- Largura dinâmica das colunas ---
    worksheet.columns = headers.map((header, i) => {
      let maxLength = header.length;
      data.forEach((row) => {
        const cellValue = row[i]?.toString() ?? '';
        if (cellValue.length > maxLength) maxLength = cellValue.length;
      });
      return {
        header,
        key: `col_${i}`,
        width: maxLength + 5,
      };
    });

    // --- Estilo do cabeçalho ---
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1E293B' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFACC15' }, // Amarelo CaçambaGo
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1E293B' } },
      };
    });
    headerRow.height = 22;

    // --- Adiciona os dados com zebra striping ---
    data.forEach((rowData, rowIndex) => {
      const row = worksheet.addRow(
        headers.reduce((acc, _, i) => ({ ...acc, [`col_${i}`]: rowData[i] ?? '' }), {})
      );
      if (rowIndex % 2 !== 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }, // Cinza muito claro
          };
        });
      }
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
      });
    });

    // --- Auto-filtro no intervalo completo ---
    const lastCol = String.fromCharCode(64 + headers.length); // ex: "D" para 4 colunas
    worksheet.autoFilter = `A1:${lastCol}1`;

    // --- Download no browser via Blob ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
