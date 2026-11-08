import { describe, expect, it } from 'vitest';

import {
  FASE,
  colorPublicoEnvio,
  esRetiro,
  fasesDelEnvio,
  historialPublico,
  progresoEnvio,
} from './fases';

const h = (estado, fecha) => ({ estado, fecha });

const DOMICILIO_EN_CAMINO = [
  h('creado', '2026-11-05T09:00:00'),
  h('en_sucursal', '2026-11-05T09:30:00'),
  h('asignado_a_viaje', '2026-11-05T14:00:00'),
  h('en_vehiculo', '2026-11-06T07:30:00'),
  h('en_camino', '2026-11-06T08:00:00'),
];

describe('fasesDelEnvio', () => {
  it('siempre 4 fases; la última es "Entregado" en domicilio y "Retiro en sucursal" en retiro', () => {
    expect(fasesDelEnvio('domicilio').map((f) => f.label)).toEqual([
      'Recibido',
      'En preparación',
      'En camino',
      'Entregado',
    ]);
    expect(fasesDelEnvio('sucursal')[3].label).toBe('Retiro en sucursal');
  });

  it('sin tipoEntrega (backend viejo) se asume domicilio', () => {
    expect(esRetiro(undefined)).toBe(false);
    expect(fasesDelEnvio(undefined)[3].label).toBe('Entregado');
  });
});

describe('progresoEnvio', () => {
  it.each([
    ['creado', FASE.RECIBIDO, 'Recibido'],
    ['en_sucursal', FASE.RECIBIDO, 'Recibido'],
    ['asignado_a_viaje', FASE.PREPARACION, 'En preparación'],
    ['en_vehiculo', FASE.PREPARACION, 'En preparación'],
    ['en_camino', FASE.EN_CAMINO, 'En camino'],
    ['entregado', FASE.FINAL, 'Entregado'],
  ])('domicilio, %s -> fase %i (%s)', (estado, actual, etiqueta) => {
    const p = progresoEnvio({ estado, historial: [h('creado', '2026-11-05T09:00:00')], tipoEntrega: 'domicilio' });
    expect(p.actual).toBe(actual);
    expect(p.etiqueta).toBe(etiqueta);
    expect(p.fases).toHaveLength(4);
  });

  it('retiro: en_sucursal DESPUÉS de un viaje es "Listo para retirar" (última fase), no el paso 2', () => {
    const p = progresoEnvio({
      estado: 'en_sucursal',
      historial: [...DOMICILIO_EN_CAMINO, h('en_sucursal', '2026-11-06T16:00:00')],
      tipoEntrega: 'sucursal',
    });
    expect(p.actual).toBe(FASE.FINAL);
    expect(p.etiqueta).toBe('Listo para retirar');
    expect(p.tipo).toBe('listo');
  });

  it('retiro: en_sucursal al principio (todavía no viajó) es "Recibido"', () => {
    const p = progresoEnvio({
      estado: 'en_sucursal',
      historial: [h('creado', '2026-11-05T09:00:00'), h('en_sucursal', '2026-11-05T09:30:00')],
      tipoEntrega: 'sucursal',
    });
    expect(p.actual).toBe(FASE.RECIBIDO);
  });

  it('retiro entregado se muestra como "Retirado"', () => {
    const p = progresoEnvio({ estado: 'entregado', historial: DOMICILIO_EN_CAMINO, tipoEntrega: 'sucursal' });
    expect(p.actual).toBe(FASE.FINAL);
    expect(p.etiqueta).toBe('Retirado');
  });

  it('domicilio: en_sucursal tras un viaje (volvió a la sucursal) cuenta como "En preparación", no como entregado', () => {
    const p = progresoEnvio({
      estado: 'en_sucursal',
      historial: [...DOMICILIO_EN_CAMINO, h('en_sucursal', '2026-11-06T16:00:00')],
      tipoEntrega: 'domicilio',
    });
    expect(p.actual).toBe(FASE.PREPARACION);
  });

  it('rechazado: no es una fase, la barra queda en la última fase alcanzada', () => {
    const p = progresoEnvio({
      estado: 'rechazado',
      historial: [...DOMICILIO_EN_CAMINO, h('rechazado', '2026-11-06T12:00:00')],
      tipoEntrega: 'domicilio',
    });
    expect(p.rechazado).toBe(true);
    expect(p.actual).toBe(FASE.EN_CAMINO);
    expect(p.etiqueta).toBe('No entregado');
  });

  it('sin `estado` explícito toma el del último evento del historial', () => {
    const p = progresoEnvio({ historial: DOMICILIO_EN_CAMINO, tipoEntrega: 'domicilio' });
    expect(p.actual).toBe(FASE.EN_CAMINO);
  });

  it('estado desconocido degrada sin romper (-1 y la etiqueta del estado)', () => {
    const p = progresoEnvio({ estado: 'algo_raro', historial: [], tipoEntrega: 'domicilio' });
    expect(p.actual).toBe(-1);
  });
});

describe('historialPublico', () => {
  it('no muestra estados internos: 5 estados del backend -> 3 entradas, más reciente primero', () => {
    const entradas = historialPublico({ estado: 'en_camino', historial: DOMICILIO_EN_CAMINO, tipoEntrega: 'domicilio' });

    expect(entradas.map((e) => e.etiqueta)).toEqual(['En camino', 'En preparación', 'Envío registrado']);
  });

  it('cada fase usa la fecha en que se alcanzó por primera vez', () => {
    const entradas = historialPublico({ estado: 'en_camino', historial: DOMICILIO_EN_CAMINO, tipoEntrega: 'domicilio' });
    const prep = entradas.find((e) => e.etiqueta === 'En preparación');

    expect(prep.fecha).toBe('2026-11-05T14:00:00');
  });

  it('viaje cancelado (vuelve a creado): las fases que ya no valen desaparecen', () => {
    const entradas = historialPublico({
      estado: 'creado',
      historial: [
        h('creado', '2026-11-05T09:00:00'),
        h('asignado_a_viaje', '2026-11-05T14:00:00'),
        h('creado', '2026-11-05T18:00:00'),
      ],
      tipoEntrega: 'domicilio',
    });

    expect(entradas.map((e) => e.etiqueta)).toEqual(['Envío registrado']);
  });

  it('retiro: "Listo para retirar en la sucursal" y después "Retirado"', () => {
    const entradas = historialPublico({
      estado: 'entregado',
      historial: [
        ...DOMICILIO_EN_CAMINO,
        h('en_sucursal', '2026-11-06T16:00:00'),
        h('entregado', '2026-11-07T10:00:00'),
      ],
      tipoEntrega: 'sucursal',
    });

    expect(entradas.map((e) => e.etiqueta)).toEqual([
      'Retirado',
      'Listo para retirar en la sucursal',
      'En camino',
      'En preparación',
      'Envío registrado',
    ]);
  });

  it('rechazado: conserva lo que pasó y agrega "No entregado" marcado como tal', () => {
    const entradas = historialPublico({
      estado: 'rechazado',
      historial: [...DOMICILIO_EN_CAMINO, h('rechazado', '2026-11-06T12:00:00')],
      tipoEntrega: 'domicilio',
    });

    expect(entradas[0]).toMatchObject({ etiqueta: 'No entregado', rechazado: true });
    expect(entradas.slice(1).map((e) => e.etiqueta)).toEqual(['En camino', 'En preparación', 'Envío registrado']);
  });

  it('historial vacío -> sin entradas', () => {
    expect(historialPublico({ estado: 'creado', historial: [], tipoEntrega: 'domicilio' })).toEqual([]);
  });
});

describe('colorPublicoEnvio', () => {
  it('un color por fase, cyan para "listo para retirar" y rojo para rechazado', () => {
    expect(colorPublicoEnvio({ actual: 0, tipo: null })).toBe('gray');
    expect(colorPublicoEnvio({ actual: 1, tipo: null })).toBe('blue');
    expect(colorPublicoEnvio({ actual: 2, tipo: null })).toBe('orange');
    expect(colorPublicoEnvio({ actual: 3, tipo: 'entregado' })).toBe('green');
    expect(colorPublicoEnvio({ actual: 3, tipo: 'listo' })).toBe('cyan');
    expect(colorPublicoEnvio({ actual: 2, tipo: 'rechazado' })).toBe('red');
  });
});
