import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EMPTY, formatDesdeAhora, formatFecha, formatFechaHora } from '@domain/format';

import { timeFromNow, toLocalDate, toLocalDateTime } from './dates';

// SHG-FE-111 / CONTRACTS §14: el backend emite hora local de Argentina, sin
// offset y con milisegundos. La web la muestra tal cual: sin sumar/restar horas
// y sin tratarla como UTC. (vite.config.js fija TZ=America/Argentina/Buenos_Aires.)

// 23:30 ART = 02:30 UTC del día siguiente: si algo interpreta el string como UTC
// y lo convierte a local, el día o la hora cambian.
const TARDE = '2026-10-07T23:30:15.123';
const CRUCE_MEDIANOCHE = '2026-10-08T00:05:00.000';
const CRUCE_ANIO = '2026-12-31T23:59:59.999';

describe('toLocalDate / toLocalDateTime con hora local de Argentina', () => {
  it('muestra la hora tal cual llega (23:30 no cruza de día)', () => {
    expect(toLocalDateTime(TARDE)).toBe('07/10/2026 23:30');
    expect(toLocalDate(TARDE)).toBe('07/10/2026');
  });

  it('respeta el cruce de medianoche y de año', () => {
    expect(toLocalDateTime(CRUCE_MEDIANOCHE)).toBe('08/10/2026 00:05');
    expect(toLocalDate(CRUCE_MEDIANOCHE)).toBe('08/10/2026');
    expect(toLocalDateTime(CRUCE_ANIO)).toBe('31/12/2026 23:59');
  });

  it('tolera milisegundos, nanosegundos (9 dígitos) y sin fracción', () => {
    expect(toLocalDateTime('2026-10-07T18:41:05.123')).toBe('07/10/2026 18:41');
    expect(toLocalDateTime('2026-10-07T18:41:05.123456789')).toBe('07/10/2026 18:41');
    expect(toLocalDateTime('2026-10-07T18:41:05')).toBe('07/10/2026 18:41');
    expect(formatFechaHora('2026-10-07T18:41:05.123456789')).toBe('07/10/2026 18:41');
    expect(formatFecha(TARDE)).toBe('07/10/2026');
  });

  it('fecha inválida o vacía devuelve siempre el mismo texto (EMPTY)', () => {
    expect(EMPTY).toBe('—');
    for (const vacio of [null, undefined, '', 'basura']) {
      expect(toLocalDate(vacio)).toBe(EMPTY);
      expect(toLocalDateTime(vacio)).toBe(EMPTY);
      expect(timeFromNow(vacio)).toBe(EMPTY);
    }
  });
});

describe('relativos', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 18:41:30 ART del 07/10/2026 (= 21:41:30 UTC).
    vi.setSystemTime(new Date('2026-10-07T21:41:30.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('un envío creado ahora dice "hace instantes", no "en 3 horas"', () => {
    expect(timeFromNow('2026-10-07T18:41:29.900')).toBe('hace unos segundos');
    expect(formatDesdeAhora('2026-10-07T18:41:29.900')).toBe('hace unos segundos');
  });

  it('una hora pasada no queda en el futuro y una futura sí', () => {
    expect(timeFromNow('2026-10-07T16:41:30.000')).toBe('hace 2 horas');
    expect(timeFromNow('2026-10-07T20:41:30.000')).toBe('en 2 horas');
  });

  it('a las 23:30 ART el relativo se calcula contra la hora local, no contra UTC', () => {
    vi.setSystemTime(new Date('2026-10-08T02:31:00.000Z')); // 23:31 ART
    expect(timeFromNow(TARDE)).toBe('hace un minuto');
  });
});
