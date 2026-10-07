import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEstadoEtaViaje } from './estadoEtaViaje';

const AHORA = new Date('2026-10-07T12:00:00Z');
const RECIENTE = '2026-10-07T11:59:00Z';
const VIEJA = '2026-10-07T11:30:00Z';
const PLAN_VIEJA = '2026-01-20T15:00:00Z';
const ETA_RUTA = new Date('2026-10-07T13:00:00Z');

describe('getEstadoEtaViaje', () => {
  afterEach(() => vi.useRealTimers());

  const conReloj = () => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
  };

  it('sin señal: estado "Sin señal" y la ETA de ruta se descarta (queda la planificada)', () => {
    conReloj();
    const r = getEstadoEtaViaje({ fechaHoraFinPlanificada: PLAN_VIEJA }, VIEJA, {
      etaRuta: ETA_RUTA,
    });
    expect(r.estado.label).toBe('Sin señal');
    expect(r.sinSenal).toBe(true);
    expect(r.etaFuente).toBe('planificada');
    expect(r.eta).toEqual(new Date(PLAN_VIEJA));
  });

  it('con señal y ruta calculada: usa la ETA de ruta aunque la planificada esté vencida', () => {
    conReloj();
    const r = getEstadoEtaViaje({ fechaHoraFinPlanificada: PLAN_VIEJA }, RECIENTE, {
      etaRuta: ETA_RUTA,
    });
    expect(r.estado.label).toBe('Demorado');
    expect(r.etaFuente).toBe('ruta');
    expect(r.eta).toBe(ETA_RUTA);
  });

  it('con señal y sin ruta: cae a la planificada', () => {
    conReloj();
    const r = getEstadoEtaViaje({ fechaHoraFinPlanificada: '2026-10-07T18:00:00Z' }, RECIENTE);
    expect(r.estado.label).toBe('A tiempo');
    expect(r.etaFuente).toBe('planificada');
  });

  it('sin ninguna fecha: eta null', () => {
    conReloj();
    const r = getEstadoEtaViaje({}, RECIENTE);
    expect(r.eta).toBeNull();
    expect(r.etaFuente).toBeNull();
  });
});
