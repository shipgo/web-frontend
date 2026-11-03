import { describe, expect, it } from 'vitest';

import { getRouteGradient } from './routeGradient';

// Los inputs de un `interpolate` van en las posiciones 3, 5, 7… de la expresión.
const inputs = (expr) => expr.slice(3).filter((_, i) => i % 2 === 0);
const colores = (expr) => expr.slice(3).filter((_, i) => i % 2 === 1);

const AZUL = '#3b82f6';
const GRIS = '#868e96';

describe('getRouteGradient (SHG-FE-137)', () => {
  it('es un interpolate lineal sobre line-progress', () => {
    const expr = getRouteGradient(0.5);
    expect(expr.slice(0, 3)).toEqual(['interpolate', ['linear'], ['line-progress']]);
  });

  it.each([0, 0.001, 0.005, -1, NaN, undefined])(
    'sin progreso (%s): toda la ruta en azul',
    (progress) => {
      const expr = getRouteGradient(progress);
      expect(inputs(expr)).toEqual([0, 1]);
      expect(colores(expr)).toEqual([AZUL, AZUL]);
    },
  );

  it.each([0.995, 0.999, 1, 1.5])('todo entregado (%s): toda la ruta en gris', (progress) => {
    const expr = getRouteGradient(progress);
    expect(inputs(expr)).toEqual([0, 1]);
    expect(colores(expr)).toEqual([GRIS, GRIS]);
  });

  it('progreso intermedio: gris hasta el progreso y azul desde ahí', () => {
    const expr = getRouteGradient(0.25);
    expect(inputs(expr)).toEqual([0, 0.245, 0.255, 1]);
    expect(colores(expr)).toEqual([GRIS, GRIS, AZUL, AZUL]);
  });

  it('los inputs son estrictamente crecientes para cualquier progreso (Mapbox rechaza la capa si no)', () => {
    const barrido = [
      0, 1e-6, 0.001, 0.004, 0.005, 0.0051, 0.006, 0.01, 0.1, 0.5, 0.9, 0.99, 0.994, 0.995, 0.9951,
      0.999, 1,
    ];
    for (const progress of barrido) {
      const xs = inputs(getRouteGradient(progress));
      xs.forEach((x, i) => {
        if (i > 0) expect(x, `progress=${progress}`).toBeGreaterThan(xs[i - 1]);
      });
    }
  });
});
