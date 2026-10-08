import { describe, expect, it } from 'vitest';

import { mantenimientoVigenteOProximo } from './mantenimiento';

const ahora = new Date(2026, 9, 10, 12, 0, 0);
const m = (patente, ini, fin) => ({
  vehiculo: { patente },
  fechaHoraMantenimiento: ini,
  fechaHoraFin: fin,
});

describe('mantenimientoVigenteOProximo', () => {
  it('prioriza el vigente sobre el próximo', () => {
    const vigente = m('AB1', '2026-10-10T08:00:00', '2026-10-11T08:00:00');
    const proximo = m('AB1', '2026-10-20T08:00:00', '2026-10-21T08:00:00');
    expect(mantenimientoVigenteOProximo([proximo, vigente], 'AB1', ahora)).toBe(vigente);
  });

  it('devuelve el próximo más cercano si no hay vigente', () => {
    const cerca = m('AB1', '2026-10-15T08:00:00', '2026-10-16T08:00:00');
    const lejos = m('AB1', '2026-11-15T08:00:00', '2026-11-16T08:00:00');
    expect(mantenimientoVigenteOProximo([lejos, cerca], 'AB1', ahora)).toBe(cerca);
  });

  it('ignora los terminados y los de otra patente (el filtro del backend es "contains")', () => {
    const terminado = m('AB1', '2026-09-01T08:00:00', '2026-09-02T08:00:00');
    const otra = m('AB12', '2026-10-10T08:00:00', '2026-10-11T08:00:00');
    expect(mantenimientoVigenteOProximo([terminado, otra], 'AB1', ahora)).toBeNull();
  });
});
