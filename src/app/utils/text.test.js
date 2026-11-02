import { describe, expect, it } from 'vitest';

import { coincideBusqueda, normalizarBusqueda } from './text';

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

describe('coincideBusqueda', () => {
  const campos = ['José', 'Pérez', null, undefined, 42];

  it('una consulta vacía o de espacios coincide con todo', () => {
    expect(coincideBusqueda('', campos)).toBe(true);
    expect(coincideBusqueda('   ', campos)).toBe(true);
    expect(coincideBusqueda(undefined, campos)).toBe(true);
  });

  it('ignora acentos y mayúsculas en los dos sentidos', () => {
    expect(coincideBusqueda('jose', campos)).toBe(true);
    expect(coincideBusqueda('JOSÉ', campos)).toBe(true);
    expect(coincideBusqueda('perez', campos)).toBe(true);
    expect(coincideBusqueda('josé', ['Jose'])).toBe(true);
  });

  it('busca por contenido, también en campos numéricos', () => {
    expect(coincideBusqueda('ere', campos)).toBe(true);
    expect(coincideBusqueda('42', campos)).toBe(true);
  });

  it('sin coincidencia (y con campos nulos) da false', () => {
    expect(coincideBusqueda('maria', campos)).toBe(false);
    expect(coincideBusqueda('null', campos)).toBe(false);
    expect(coincideBusqueda('x', [])).toBe(false);
  });
});
