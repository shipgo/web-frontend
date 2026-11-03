import { describe, expect, it } from 'vitest';

import { codigoEsValido, normalizarCodigo } from './utils';

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
