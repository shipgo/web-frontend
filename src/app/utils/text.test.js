import { describe, expect, it } from 'vitest';

import { normalizarBusqueda } from './text';

describe('normalizarBusqueda', () => {
  it('saca acentos y diéresis y pasa a minúsculas', () => {
    expect(normalizarBusqueda('Vehículos')).toBe('vehiculos');
    expect(normalizarBusqueda('ENVÍOS')).toBe('envios');
    expect(normalizarBusqueda('Pingüino')).toBe('pinguino');
  });

  it('con y sin acento dan lo mismo', () => {
    expect(normalizarBusqueda('Córdoba')).toBe(normalizarBusqueda('cordoba'));
  });

  it('deja intactos números, guiones y espacios', () => {
    expect(normalizarBusqueda('AA 123-BB')).toBe('aa 123-bb');
  });

  it('null, undefined y vacío dan string vacío', () => {
    expect(normalizarBusqueda(null)).toBe('');
    expect(normalizarBusqueda(undefined)).toBe('');
    expect(normalizarBusqueda('')).toBe('');
  });
});
