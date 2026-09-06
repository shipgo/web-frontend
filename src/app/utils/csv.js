import dayjs from 'dayjs';

/**
 * Exportación de listados a CSV, 100% client-side (`CONTRACTS.md §10`).
 *
 * Objetivo: que el archivo abra sin fricción en Excel configurado en es-AR:
 * - **BOM UTF-8** (`U+FEFF`) al inicio → Excel respeta acentos y la Ñ.
 * - Separador **`;`** → en el locale es-AR la coma es separador decimal, así que
 *   Excel espera `;` como separador de columnas.
 * - Fin de línea **CRLF** (`\r\n`) → formato canónico de CSV (RFC 4180), es lo
 *   que espera Excel en Windows.
 * - Valores con `;`, `"`, salto de línea o que empiezan con espacio → van entre
 *   comillas dobles, y las comillas internas se duplican (`"` → `""`).
 */

/** Máximo de filas que exportamos de una. Si el filtro matchea más, se trunca y se avisa. */
export const CSV_MAX_ROWS = 5000;

/** Byte Order Mark UTF-8: sin esto Excel es-AR rompe los acentos. */
const BOM = '﻿';
const SEPARATOR = ';';
const EOL = '\r\n';

/** `true` si el valor necesita ir entrecomillado. */
const needsQuoting = (value) =>
  value.includes(SEPARATOR) ||
  value.includes('"') ||
  value.includes('\n') ||
  value.includes('\r') ||
  value.startsWith(' ') ||
  value.endsWith(' ');

/**
 * Neutraliza CSV injection: Excel/Sheets ejecutan como fórmula cualquier celda
 * que empiece con `= + - @` (o tab/CR). Un nombre de remitente o mecánico que
 * arranque con `-` o `+` es plausible. Se prefija con `'` para que el motor de
 * fórmulas lo trate como texto literal.
 */
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];
const neutralizeFormula = (value) =>
  value && FORMULA_TRIGGERS.includes(value[0]) ? `'${value}` : value;

/**
 * Normaliza una celda a string y la escapa para CSV.
 * `null` / `undefined` / `NaN` → celda vacía.
 */
export const escapeCsvValue = (raw) => {
  if (raw == null) return '';
  if (typeof raw === 'number' && Number.isNaN(raw)) return '';

  let value;
  if (raw instanceof Date) {
    value = dayjs(raw).isValid() ? dayjs(raw).format('DD/MM/YYYY HH:mm') : '';
  } else if (typeof raw === 'boolean') {
    value = raw ? 'Sí' : 'No';
  } else if (typeof raw === 'number') {
    value = String(raw);
  } else {
    value = neutralizeFormula(String(raw));
  }

  if (!needsQuoting(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
};

/**
 * @typedef {Object} CsvColumn
 * @property {string} header  Encabezado en español (lo que ve el usuario en Excel).
 * @property {string} [key]   Propiedad directa de la fila. Ignorado si hay `value`.
 * @property {(row: any) => *} [value]  Accesor/derivación a partir de la fila cruda.
 */

/**
 * Serializa `rows` a un string CSV (con BOM). Función pura → testeable.
 * @param {any[]} rows
 * @param {CsvColumn[]} columns
 * @returns {string}
 */
export const buildCsv = (rows, columns) => {
  const headerLine = columns
    .map((col) => escapeCsvValue(col.header))
    .join(SEPARATOR);

  const dataLines = (rows ?? []).map((row) =>
    columns
      .map((col) => {
        const cell = col.value ? col.value(row) : row?.[col.key];
        return escapeCsvValue(cell);
      })
      .join(SEPARATOR),
  );

  return BOM + [headerLine, ...dataLines].join(EOL) + EOL;
};

/**
 * Dispara la descarga de un `Blob` en el navegador.
 * @param {Blob} blob
 * @param {string} filename
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revocar en el próximo tick: algunos navegadores necesitan que la URL siga
  // viva cuando procesan el click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * Construye el CSV y dispara la descarga.
 * @param {any[]} rows
 * @param {CsvColumn[]} columns
 * @param {string} filename  Ej: `envios_2026-09-06.csv`.
 */
export const toCsv = (rows, columns, filename) => {
  const content = buildCsv(rows, columns);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
};

/**
 * Nombre de archivo canónico: `<entidad>_<fecha>.csv` (ej. `envios_2026-09-06.csv`).
 * @param {string} entidad
 * @returns {string}
 */
export const csvFilename = (entidad) =>
  `${entidad}_${dayjs().format('YYYY-MM-DD')}.csv`;
