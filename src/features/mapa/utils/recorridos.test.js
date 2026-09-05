import { describe, it, expect } from 'vitest';

import { coordsDeRecorrido, direccionDeRecorrido, ordenarParadas } from './recorridos';

describe('coordsDeRecorrido', () => {
  it('usa las coords del puntoEntrega cuando está presente', () => {
    const recorrido = { puntoEntrega: { latitud: -34.6, longitud: -58.4 } };
    expect(coordsDeRecorrido(recorrido)).toEqual([-58.4, -34.6]);
  });

  it('cae a sucursalDestino.puntoEntrega cuando no hay puntoEntrega directo', () => {
    const recorrido = {
      sucursalDestino: { puntoEntrega: { latitud: -31.4, longitud: -64.2 } },
    };
    expect(coordsDeRecorrido(recorrido)).toEqual([-64.2, -31.4]);
  });

  it('devuelve null si no hay coords disponibles', () => {
    expect(coordsDeRecorrido({})).toBeNull();
    expect(coordsDeRecorrido({ puntoEntrega: {} })).toBeNull();
  });
});

describe('direccionDeRecorrido', () => {
  it('arma la dirección a partir del puntoEntrega', () => {
    const recorrido = {
      puntoEntrega: { nombreCalle: 'Av. Corrientes', numeroCalle: '1234' },
    };
    expect(direccionDeRecorrido(recorrido)).toContain('Corrientes');
  });

  it('usa el nombre de la sucursal cuando la parada es una entrega a sucursal', () => {
    const recorrido = { sucursalDestino: { nombre: 'Sucursal Rosario' } };
    expect(direccionDeRecorrido(recorrido)).toBe('Sucursal Rosario');
  });

  it('devuelve el placeholder cuando no hay ninguna parada', () => {
    expect(direccionDeRecorrido({})).toBe('—');
  });
});

describe('ordenarParadas', () => {
  it('ordena los recorridos por orden y les agrega las coords resueltas', () => {
    const recorridos = [
      { id: 2, orden: 2, puntoEntrega: { latitud: -34.6, longitud: -58.4 } },
      { id: 1, orden: 1, puntoEntrega: { latitud: -34.5, longitud: -58.3 } },
    ];

    const paradas = ordenarParadas(recorridos);

    expect(paradas.map((p) => p.id)).toEqual([1, 2]);
    expect(paradas[0].coords).toEqual([-58.3, -34.5]);
  });

  it('devuelve un array vacío si no hay recorridos', () => {
    expect(ordenarParadas()).toEqual([]);
    expect(ordenarParadas([])).toEqual([]);
  });
});
