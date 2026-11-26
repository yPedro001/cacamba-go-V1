import { sanitizeSpreadsheetCell } from '@/lib/domain-helpers';

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

function getExcelColumnLetter(index: number): string {
  let col = '';
  let n = Math.max(1, index);
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col || 'A';
}

/**
 * ExportService: Centraliza a geração de documentos profissionais.
 * - PDF: jsPDF + jspdf-autotable
 * - Excel: ExcelJS com sanitização contra formula injection
 */
class ExportService {
  private primaryColor = '#D97706'; // Âmbar CaçambaGo
  private secondaryColor = '#191715'; // Grafite CaçambaGo

  async exportPDF({ title, filename, headers, data }: ExportData): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF();
    const date = new Date().toLocaleString('pt-BR');

    doc.setFillColor(this.primaryColor);
    doc.rect(10, 10, 15, 15, 'F');
    doc.setTextColor(this.secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Caçamba', 28, 20);
    doc.setTextColor(this.primaryColor);
    doc.text('Go', 64, 20);

    doc.setTextColor(this.secondaryColor);
    doc.setFontSize(15);
    doc.text(title, 10, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Gerado em: ${date}`, 10, 46);
    doc.line(10, 49, 200, 49);

    autoTable(doc, {
      startY: 54,
      head: [headers],
      body: data,
      theme: 'striped',
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9.5,
        cellPadding: 4,
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [248, 247, 244],
      },
      margin: { top: 30 },
      didDrawPage: (pageData) => {
        doc.setFontSize(8);
        doc.setTextColor(130);
        doc.text(
          `Página ${pageData.pageNumber}`,
          doc.internal.pageSize.width - 25,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          'CaçambaGo - Gestão Operacional de Caçambas',
          10,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`${filename}.pdf`);
  }

  async exportExcel({ title, filename, headers, data }: ExportData): Promise<void> {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CaçambaGo';
    workbook.created = new Date();

    const sheetName = title.slice(0, 31);
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = headers.map((header, i) => {
      let maxLength = header.length;
      data.forEach((row) => {
        const cellValue = row[i]?.toString() ?? '';
        if (cellValue.length > maxLength) maxLength = cellValue.length;
      });
      return {
        header,
        key: `col_${i}`,
        width: Math.min(60, maxLength + 5),
      };
    });

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD97706' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF191715' } },
      };
    });
    headerRow.height = 24;

    data.forEach((rowData, rowIndex) => {
      const row = worksheet.addRow(
        headers.reduce<Record<string, string | number>>(
          (acc, _, i) => ({ ...acc, [`col_${i}`]: sanitizeSpreadsheetCell(rowData[i] ?? '') }),
          {}
        )
      );
      if (rowIndex % 2 !== 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F7F4' },
          };
        });
      }
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
      });
    });

    const lastCol = getExcelColumnLetter(headers.length);
    worksheet.autoFilter = `A1:${lastCol}1`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}.xlsx`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export const exportService = new ExportService();
