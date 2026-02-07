import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportData {
  [key: string]: string | number | boolean | null | undefined;
}

export function exportToExcel(
  data: ExportData[],
  columns: ExportColumn[],
  fileName: string
) {
  // Create worksheet data with headers
  const wsData = [
    columns.map((col) => col.header),
    ...data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return "";
        return value;
      })
    ),
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = columns.map((col) => ({
    wch: col.width || 15,
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ma'lumotlar");

  // Save file
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportToPDF(
  data: ExportData[],
  columns: ExportColumn[],
  title: string,
  fileName: string
) {
  // Create printable HTML content
  const tableRows = data
    .map(
      (row) => `
      <tr>
        ${columns
          .map((col) => {
            const value = row[col.key];
            return `<td style="border: 1px solid #ddd; padding: 8px;">${
              value ?? ""
            }</td>`;
          })
          .join("")}
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #4a5568;
          color: white;
          padding: 12px 8px;
          text-align: left;
          border: 1px solid #ddd;
        }
        td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .meta {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-bottom: 10px;
        }
        @media print {
          body { margin: 0; }
          h1 { font-size: 18px; }
          table { font-size: 12px; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Sana: ${new Date().toLocaleDateString("uz-UZ")} | Jami: ${data.length} ta yozuv</p>
      <table>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col.header}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
