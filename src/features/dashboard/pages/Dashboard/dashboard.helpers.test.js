import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_QUICK_FILTER,
  QUICK_FILTERS,
  getDefaultFiltros,
  getPeriodoLabel,
  getQuickFilterRange,
  toDashboardParams,
} from './dashboard.helpers';

describe('QUICK_FILTERS', () => {
  it('todos abarcan al menos 2 días distintos (el backend rechaza rangos de 1 día)', () => {
    QUICK_FILTERS.forEach(({ getRange }) => {
      const [desde, hasta] = getRange();
      expect(dayjs(hasta).diff(dayjs(desde), 'day')).toBeGreaterThanOrEqual(1);
    });
  });

  it('el default es "Últimos 7 días"', () => {
    expect(DEFAULT_QUICK_FILTER).toBe('Últimos 7 días');
    expect(getDefaultFiltros().quickFilterLabel).toBe('Últimos 7 días');
  });
});

describe('getQuickFilterRange', () => {
  it('devuelve strings YYYY-MM-DD', () => {
    const [desde, hasta] = getQuickFilterRange('Últimos 7 días');
    expect(desde).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(hasta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('null para un label desconocido', () => {
    expect(getQuickFilterRange('nope')).toBeNull();
  });
});

describe('toDashboardParams', () => {
  it('devuelve null si el rango está incompleto', () => {
    expect(toDashboardParams({ date: [null, null] })).toBeNull();
    expect(toDashboardParams({ date: ['2026-09-01', null] })).toBeNull();
  });

  it('pasa desde/hasta tal cual cuando son días distintos', () => {
    expect(
      toDashboardParams({ date: ['2026-09-01', '2026-09-07'], sucursalId: null }),
    ).toEqual({ desde: '2026-09-01', hasta: '2026-09-07', sucursalId: null });
  });

  it('corre hasta +1 día cuando desde === hasta (workaround del 400 del backend)', () => {
    expect(
      toDashboardParams({ date: ['2026-09-05', '2026-09-05'], sucursalId: null }),
    ).toEqual({ desde: '2026-09-05', hasta: '2026-09-06', sucursalId: null });
  });

  it('convierte el sucursalId del Select (string) a number, y "" / null a null', () => {
    expect(
      toDashboardParams({ date: ['2026-09-01', '2026-09-07'], sucursalId: '3' })
        .sucursalId,
    ).toBe(3);
    expect(
      toDashboardParams({ date: ['2026-09-01', '2026-09-07'], sucursalId: '' })
        .sucursalId,
    ).toBeNull();
  });
});

describe('getPeriodoLabel', () => {
  it('usa el label del quick-filter si hay uno activo', () => {
    expect(
      getPeriodoLabel({ date: ['2026-09-01', '2026-09-07'], quickFilterLabel: 'Último mes' }),
    ).toBe('Último mes');
  });

  it('arma DD/MM – DD/MM para un rango custom', () => {
    expect(
      getPeriodoLabel({ date: ['2026-09-01', '2026-09-07'], quickFilterLabel: null }),
    ).toBe('01/09 – 07/09');
  });

  it('agrega la sucursal cuando se pasa el label', () => {
    expect(
      getPeriodoLabel(
        { date: ['2026-09-01', '2026-09-07'], quickFilterLabel: 'Último mes' },
        'Centro',
      ),
    ).toBe('Último mes · Centro');
  });
});
