/**
 * Exportação de listagens sem dependências externas.
 *
 * - Excel: SpreadsheetML (`.xls`) aberto nativamente pelo Excel/LibreOffice.
 * - PDF: ficheiro gerado à mão (Helvetica, tabela por página).
 * - CSV: delimitador `;` com BOM (compatível com Excel em pt-PT).
 */

export type ExportValue = string | number | null | undefined;

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => ExportValue;
  /** Largura em caracteres usada no PDF (por omissão, igual ao cabeçalho). */
  width?: number;
}

export interface ExportDataset<T> {
  /** Nome base do ficheiro, sem extensão. */
  filename: string;
  /** Nome da folha no Excel e título do relatório em PDF. */
  title: string;
  /** Linhas de contexto (período, filtros, totais) impressas em PDF/Excel. */
  notes?: string[];
  columns: ExportColumn<T>[];
  rows: T[];
}

function text(value: ExportValue): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function download(filename: string, mimeType: string, payload: string | Uint8Array) {
  const blob = new Blob([payload as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------- CSV

export function exportCsv<T>(dataset: ExportDataset<T>): void {
  const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const lines = [
    dataset.columns.map((column) => escapeCell(column.header)).join(";"),
    ...dataset.rows.map((row) => dataset.columns.map((column) => escapeCell(text(column.value(row)))).join(";")),
  ];
  download(`${dataset.filename}.csv`, "text/csv;charset=utf-8", `\uFEFF${lines.join("\r\n")}`);
}

// ---------------------------------------------------------------- Excel (SpreadsheetML)

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function excelCell(value: ExportValue): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(text(value))}</Data></Cell>`;
}

export function exportExcel<T>(dataset: ExportDataset<T>): void {
  const notes = (dataset.notes ?? []).map(
    (note) => `<Row><Cell><Data ss:Type="String">${escapeXml(note)}</Data></Cell></Row>`,
  );

  const body = [
    ...(notes.length ? [...notes, "<Row/>"] : []),
    `<Row>${dataset.columns.map((column) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(column.header)}</Data></Cell>`).join("")}</Row>`,
    ...dataset.rows.map(
      (row) => `<Row>${dataset.columns.map((column) => excelCell(column.value(row))).join("")}</Row>`,
    ),
  ].join("");

  const xml = [
    '<?xml version="1.0"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    '<Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#D9E2F3" ss:Pattern="Solid"/></Style></Styles>',
    `<Worksheet ss:Name="${escapeXml(dataset.title.slice(0, 31))}"><Table>${body}</Table></Worksheet>`,
    "</Workbook>",
  ].join("");

  download(`${dataset.filename}.xls`, "application/vnd.ms-excel;charset=utf-8", xml);
}

// ---------------------------------------------------------------- PDF

const PDF_COLS = 104;
const PDF_ROWS_PER_PAGE = 32;

function pdfEscape(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 63;
    if (char === "\\" || char === "(" || char === ")") {
      out += `\\${char}`;
    } else if (code >= 32 && code <= 255) {
      out += char;
    } else {
      out += "?";
    }
  }
  return out;
}

function padCell(value: string, width: number): string {
  const slice = value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;
  return slice.padEnd(width);
}

/** Converte uma tabela em linhas de texto com colunas alinhadas (largura fixa). */
function toTextTable<T>(dataset: ExportDataset<T>): { header: string; rows: string[] } {
  const widths = dataset.columns.map((column) =>
    Math.max(column.width ?? column.header.length, column.header.length, 6),
  );
  const scale = Math.min(1, PDF_COLS / widths.reduce((sum, width) => sum + width + 2, 0));
  const scaled = widths.map((width) => Math.max(4, Math.floor(width * scale)));

  const header = dataset.columns.map((column, index) => padCell(column.header.toUpperCase(), scaled[index])).join("  ");
  const rows = dataset.rows.map((row) =>
    dataset.columns.map((column, index) => padCell(text(column.value(row)), scaled[index])).join("  "),
  );
  return { header, rows };
}

function buildPdf(pages: string[]): Uint8Array {
  const objects: string[] = [];
  const pageIds: number[] = [];
  const firstPageId = 5 + pages.length * 2;

  for (let index = 0; index < pages.length; index += 1) {
    pageIds.push(firstPageId + index * 2);
  }

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  pages.forEach((stream, index) => {
    const pageId = firstPageId + index * 2;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [];
  let length = chunks[0].length;

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = length;
    const chunk = `${id} 0 obj\n${objects[id]}\nendobj\n`;
    chunks.push(chunk);
    length += chunk.length;
  }

  const xrefOffset = length;
  const total = objects.length;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let id = 1; id < total; id += 1) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  chunks.push(xref);
  chunks.push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let cursor = 0;
  for (const chunk of chunks) {
    for (let index = 0; index < chunk.length; index += 1) {
      bytes[cursor] = chunk.charCodeAt(index) & 0xff;
      cursor += 1;
    }
  }
  return bytes;
}

export function exportPdf<T>(dataset: ExportDataset<T>): void {
  const { header, rows } = toTextTable(dataset);

  const headerLines = [dataset.title, ...(dataset.notes ?? []), "", header];
  const pageTexts: string[][] = [];
  for (let index = 0; index < rows.length; index += PDF_ROWS_PER_PAGE) {
    pageTexts.push(rows.slice(index, index + PDF_ROWS_PER_PAGE));
  }
  if (pageTexts.length === 0) pageTexts.push([]);

  const streams = pageTexts.map((pageRows, pageIndex) => {
    const ops: string[] = [];
    let y = 800;

    if (pageIndex === 0) {
      for (const line of headerLines) {
        const isTitle = line === dataset.title;
        ops.push(`BT /${isTitle ? "F2" : "F1"} ${isTitle ? 15 : 9} Tf 40 ${y} Td (${pdfEscape(line)}) Tj ET`);
        y -= isTitle ? 20 : 12;
      }
      y -= 6;
    } else {
      ops.push(`BT /F1 9 Tf 40 ${y} Td (${pdfEscape(`${dataset.title} (continuação)`)}) Tj ET`);
      y -= 18;
      ops.push(`BT /F2 8 Tf 40 ${y} Td (${pdfEscape(header)}) Tj ET`);
      y -= 14;
    }

    if (pageRows.length === 0) {
      ops.push(`BT /F1 9 Tf 40 ${y} Td (${pdfEscape("Sem registos para os filtros seleccionados.")}) Tj ET`);
    }

    for (const row of pageRows) {
      ops.push(`BT /F1 7 Tf 40 ${y} Td (${pdfEscape(row)}) Tj ET`);
      y -= 14;
    }

    ops.push(`BT /F1 7 Tf 40 30 Td (${pdfEscape(`Página ${pageIndex + 1} de ${pageTexts.length}`)}) Tj ET`);
    return ops.join("\n");
  });

  download(`${dataset.filename}.pdf`, "application/pdf", buildPdf(streams) as unknown as BlobPart);
}

/** Exporta o conjunto completo no formato pedido (usado pela barra de exportação). */
export function exportDataset<T>(dataset: ExportDataset<T>, format: "excel" | "pdf" | "csv"): void {
  if (format === "excel") exportExcel(dataset);
  else if (format === "pdf") exportPdf(dataset);
  else exportCsv(dataset);
}
