import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CSV_MAX_ROWS,
  buildCsv,
  csvFilename,
  downloadBlob,
  escapeCsvValue,
  toCsv,
} from './csv';

const BOM = '﻿';

describe('escapeCsvValue', () => {
  it('deja pasar valores simples sin comillas', () => {
    expect(escapeCsvValue('Hola')).toBe('Hola');
    expect(escapeCsvValue(42)).toBe('42');
  });

  it('null / undefined / NaN → celda vacía', () => {
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(undefined)).toBe('');
    expect(escapeCsvValue(NaN)).toBe('');
  });

  it('entrecomilla cuando hay separador ";"', () => {
    expect(escapeCsvValue('Calle Falsa; 123')).toBe('"Calle Falsa; 123"');
  });

  it('duplica las comillas dobles internas', () => {
    expect(escapeCsvValue('Envío "urgente"')).toBe('"Envío ""urgente"""');
  });

  it('entrecomilla ante saltos de línea', () => {
    expect(escapeCsvValue('linea 1\nlinea 2')).toBe('"linea 1\nlinea 2"');
    expect(escapeCsvValue('con retorno\r')).toBe('"con retorno\r"');
  });

  it('entrecomilla si empieza o termina con espacio', () => {
    expect(escapeCsvValue(' pegado')).toBe('" pegado"');
    expect(escapeCsvValue('pegado ')).toBe('"pegado "');
  });

  it('normaliza booleanos a Sí / No', () => {
    expect(escapeCsvValue(true)).toBe('Sí');
    expect(escapeCsvValue(false)).toBe('No');
  });
});

describe('buildCsv', () => {
  const columns = [
    { header: 'Código', key: 'codigo' },
    { header: 'Cliente', value: (row) => `${row.nombre} ${row.apellido}` },
    { header: 'Total', key: 'total' },
  ];

  it('arranca con BOM UTF-8', () => {
    const csv = buildCsv([], columns);
    expect(csv.startsWith(BOM)).toBe(true);
  });

  it('usa ";" como separador de columnas y CRLF entre filas', () => {
    const csv = buildCsv(
      [{ codigo: 'AB1', nombre: 'Ada', apellido: 'Lovelace', total: 10 }],
      columns,
    );
    const [header, firstRow] = csv.replace(BOM, '').split('\r\n');
    expect(header).toBe('Código;Cliente;Total');
    expect(firstRow).toBe('AB1;Ada Lovelace;10');
  });

  it('aplica los accesores value() y escapa cada celda', () => {
    const csv = buildCsv(
      [{ codigo: 'X;1', nombre: 'Grace', apellido: 'Hopper "GH"', total: 3 }],
      columns,
    );
    const firstRow = csv.replace(BOM, '').split('\r\n')[1];
    expect(firstRow).toBe('"X;1";"Grace Hopper ""GH""";3');
  });

  it('soporta rows vacío (solo encabezados)', () => {
    const csv = buildCsv(null, columns);
    expect(csv).toBe(`${BOM}Código;Cliente;Total\r\n`);
  });

  it('termina cada archivo con un salto de línea', () => {
    const csv = buildCsv([{ codigo: 'A', nombre: 'a', apellido: 'b', total: 1 }], columns);
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});

describe('csvFilename', () => {
  it('usa el patrón <entidad>_<fecha>.csv', () => {
    expect(csvFilename('envios')).toMatch(/^envios_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe('CSV_MAX_ROWS', () => {
  it('es un límite razonable y finito', () => {
    expect(CSV_MAX_ROWS).toBeGreaterThan(0);
    expect(Number.isFinite(CSV_MAX_ROWS)).toBe(true);
  });
});

describe('downloadBlob / toCsv', () => {
  let clickSpy;
  let createObjectURL;
  let revokeObjectURL;

  beforeEach(() => {
    clickSpy = vi.fn();
    createObjectURL = vi.fn(() => 'blob:fake');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('downloadBlob crea un <a download> y dispara el click', () => {
    downloadBlob(new Blob(['x']), 'test.csv');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('toCsv genera el contenido y dispara la descarga', () => {
    toCsv([{ a: 1 }], [{ header: 'A', key: 'a' }], 'archivo.csv');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
