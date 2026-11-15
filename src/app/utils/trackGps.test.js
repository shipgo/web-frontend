import { describe, expect, it } from 'vitest';
import { coordenadasDeHistorial, puntosDeHistorial, simplificarTrack } from './trackGps';

// ~0.0001 grados de latitud = ~11 m
const p = (orden, latitud, longitud) => ({ orden, latitud, longitud });

describe('puntosDeHistorial', () => {
  it('ordena por orden', () => {
    const r = puntosDeHistorial([p(3, 1, 1), p(1, 2, 2), p(2, 3, 3)]);
    expect(r.map((x) => x.orden)).toEqual([1, 2, 3]);
  });
  it('descarta null, NaN y no numéricos', () => {
    const r = puntosDeHistorial([p(1, null, 1), p(2, NaN, 1), p(3, 1, undefined), p(4, 1, 2)]);
    expect(r).toEqual([{ lat: 1, lng: 2, orden: 4 }]);
  });
  it('conserva coordenadas 0 (válidas)', () => {
    expect(puntosDeHistorial([p(1, 0, 0), p(2, 0, 5)])).toHaveLength(2);
  });
  it('tolera entrada no array', () => {
    expect(puntosDeHistorial(undefined)).toEqual([]);
  });
});

describe('simplificarTrack', () => {
  it('descarta puntos a menos de 10 m del último conservado', () => {
    const pts = puntosDeHistorial([p(1, 0, 0), p(2, 0.00003, 0), p(3, 0.00006, 0), p(4, 0.0002, 0)]);
    expect(simplificarTrack(pts).map((x) => x.orden)).toEqual([1, 4]);
  });
  it('conserva puntos lejanos, primero y último', () => {
    const pts = puntosDeHistorial([p(1, 0, 0), p(2, 0.001, 0), p(3, 0.002, 0)]);
    expect(simplificarTrack(pts)).toHaveLength(3);
  });
  it('conserva el último aunque esté cerca', () => {
    const pts = puntosDeHistorial([p(1, 0, 0), p(2, 0.00001, 0)]);
    expect(simplificarTrack(pts)).toHaveLength(2);
  });
});

describe('coordenadasDeHistorial', () => {
  it('devuelve [lng, lat]', () => {
    expect(coordenadasDeHistorial([p(1, -34.6, -58.4), p(2, -34.7, -58.5)])).toEqual([
      [-58.4, -34.6],
      [-58.5, -34.7],
    ]);
  });
  it('menos de 2 puntos válidos devuelve 0 o 1 coordenada', () => {
    expect(coordenadasDeHistorial([p(1, null, 1)])).toEqual([]);
    expect(coordenadasDeHistorial([p(1, 1, 1)])).toHaveLength(1);
  });
});
