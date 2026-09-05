import { describe, it, expect, vi, afterEach } from 'vitest';

import { getEstadoVisualViaje } from './estadoVisual';

describe('getEstadoVisualViaje', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve "Sin señal" cuando no hay ninguna ubicación conocida', () => {
    expect(getEstadoVisualViaje({}, null)).toEqual(
      expect.objectContaining({ label: 'Sin señal', color: 'gray' }),
    );
  });

  it('devuelve "Sin señal" cuando la última ubicación es más vieja que el umbral', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const viejaUbicacion = '2026-01-01T11:50:00Z'; // 10 minutos atrás
    expect(getEstadoVisualViaje({}, viejaUbicacion)).toEqual(
      expect.objectContaining({ label: 'Sin señal', color: 'gray' }),
    );
  });

  it('devuelve "Demorado" cuando ya pasó la fecha de llegada planificada y hay señal reciente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const ubicacionReciente = '2026-01-01T11:59:00Z';
    const viaje = { fechaHoraFinPlanificada: '2026-01-01T11:00:00Z' };

    expect(getEstadoVisualViaje(viaje, ubicacionReciente)).toEqual(
      expect.objectContaining({ label: 'Demorado', color: 'orange' }),
    );
  });

  it('devuelve "A tiempo" cuando hay señal reciente y todavía no llegó la fecha planificada', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const ubicacionReciente = '2026-01-01T11:59:00Z';
    const viaje = { fechaHoraFinPlanificada: '2026-01-01T18:00:00Z' };

    expect(getEstadoVisualViaje(viaje, ubicacionReciente)).toEqual(
      expect.objectContaining({ label: 'A tiempo', color: 'green' }),
    );
  });

  it('devuelve "A tiempo" cuando no hay fecha planificada pero sí señal reciente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    expect(getEstadoVisualViaje({}, '2026-01-01T11:59:00Z')).toEqual(
      expect.objectContaining({ label: 'A tiempo', color: 'green' }),
    );
  });

  it('ordena por prioridad: sin señal < demorado < a tiempo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const sinSenal = getEstadoVisualViaje({}, null);
    const demorado = getEstadoVisualViaje(
      { fechaHoraFinPlanificada: '2026-01-01T11:00:00Z' },
      '2026-01-01T11:59:00Z',
    );
    const aTiempo = getEstadoVisualViaje(
      { fechaHoraFinPlanificada: '2026-01-01T18:00:00Z' },
      '2026-01-01T11:59:00Z',
    );

    expect(sinSenal.prioridad).toBeLessThan(demorado.prioridad);
    expect(demorado.prioridad).toBeLessThan(aTiempo.prioridad);
  });
});
