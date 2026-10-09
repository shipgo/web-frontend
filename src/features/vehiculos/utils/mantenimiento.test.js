import { describe, expect, it } from 'vitest';

import { mantenimientoEtiqueta, motivoNoDisponible } from './mantenimiento';

describe('mantenimientoEtiqueta', () => {
  it('vigente: "En mantenimiento hasta el DD/MM/YYYY HH:mm"', () => {
    expect(
      mantenimientoEtiqueta({
        fechaHoraMantenimiento: '2026-10-10T08:00:00.000',
        fechaHoraFin: '2026-10-11T18:30:00.000',
        vigente: true,
      }),
    ).toBe('En mantenimiento hasta el 11/10/2026 18:30');
  });

  it('próximo (vigente: false): "Mantenimiento programado del … al …"', () => {
    expect(
      mantenimientoEtiqueta({
        fechaHoraMantenimiento: '2026-10-10T08:00:00.000',
        fechaHoraFin: '2026-10-11T18:30:00.000',
        vigente: false,
      }),
    ).toBe('Mantenimiento programado del 10/10/2026 08:00 al 11/10/2026 18:30');
  });
});

describe('motivoNoDisponible', () => {
  it('usa la fecha de fin del mantenimiento que bloquea', () => {
    expect(
      motivoNoDisponible({ mantenimiento: { fechaHoraFin: '2026-10-11T21:28:38.376' } }),
    ).toBe('En mantenimiento hasta el 11/10/2026 21:28');
  });

  it('sin dato de fin, cae a "En mantenimiento"', () => {
    expect(motivoNoDisponible({})).toBe('En mantenimiento');
  });
});
