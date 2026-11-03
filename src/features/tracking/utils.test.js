import { describe, expect, it } from 'vitest';

import { codigoEsValido, fechaEntrega, normalizarCodigo } from './utils';

describe('normalizarCodigo', () => {
  it('saca espacios y guiones y pasa a mayúsculas', () => {
    expect(normalizarCodigo(' 7k2m 9qx4-tp ')).toBe('7K2M9QX4TP');
  });

  it('devuelve string vacío para valores no-string', () => {
    expect(normalizarCodigo(null)).toBe('');
    expect(normalizarCodigo(undefined)).toBe('');
    expect(normalizarCodigo(1234)).toBe('');
  });
});

describe('codigoEsValido', () => {
  it('acepta el formato del backend (10 chars alfanuméricos)', () => {
    expect(codigoEsValido('7K2M9QX4TP')).toBe(true);
    expect(codigoEsValido('7k2m9qx4tp')).toBe(true);
    expect(codigoEsValido('7k2m 9qx4 tp')).toBe(true);
  });

  it('rechaza vacío, muy corto, muy largo o con símbolos', () => {
    expect(codigoEsValido('')).toBe(false);
    expect(codigoEsValido('   ')).toBe(false);
    expect(codigoEsValido('ABC')).toBe(false);
    expect(codigoEsValido('A'.repeat(20))).toBe(false);
    expect(codigoEsValido('7K2M9QX4T@')).toBe(false);
  });
});

describe('fechaEntrega', () => {
  it('devuelve la fecha del evento entregado', () => {
    expect(
      fechaEntrega([
        { estado: 'creado', fecha: '2026-09-01T10:00:00' },
        { estado: 'entregado', fecha: '2026-09-04T15:30:00' },
      ]),
    ).toBe('2026-09-04T15:30:00');
  });

  it('sin evento entregado (o sin historial) devuelve null', () => {
    expect(fechaEntrega([{ estado: 'en_camino', fecha: '2026-09-03T08:00:00' }])).toBeNull();
    expect(fechaEntrega([{ estado: 'rechazado', fecha: '2026-09-03T08:00:00' }])).toBeNull();
    expect(fechaEntrega([])).toBeNull();
    expect(fechaEntrega(undefined)).toBeNull();
  });

  it('con varios eventos entregado usa el más reciente, sin importar el orden', () => {
    expect(
      fechaEntrega([
        { estado: 'entregado', fecha: '2026-09-06T09:00:00' },
        { estado: 'entregado', fecha: '2026-09-04T09:00:00' },
        { estado: 'entregado', fecha: '2026-09-05T09:00:00' },
      ]),
    ).toBe('2026-09-06T09:00:00');
  });

  it('ignora eventos entregado con fecha inválida', () => {
    expect(fechaEntrega([{ estado: 'entregado', fecha: 'no-es-fecha' }])).toBeNull();
  });
});
