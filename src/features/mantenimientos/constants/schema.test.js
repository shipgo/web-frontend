import { describe, expect, it } from 'vitest';

import { MANTENIMIENTO_SCHEMA } from './schema';

const VALID = {
  nombreMecanico: 'Juan',
  apellidoMecanico: 'Pérez',
  vehiculoID: '7',
  tipoMantenimientoID: '3',
  fechaHoraMantenimiento: new Date(2026, 5, 15, 9, 0, 0),
  descripcion: '',
};

describe('MANTENIMIENTO_SCHEMA', () => {
  it('acepta un mantenimiento con todos los campos requeridos por MantenimientoReqDTO', () => {
    expect(MANTENIMIENTO_SCHEMA.safeParse(VALID).success).toBe(true);
  });

  it('rechaza sin nombre o apellido del mecánico', () => {
    expect(
      MANTENIMIENTO_SCHEMA.safeParse({ ...VALID, nombreMecanico: '  ' }).success,
    ).toBe(false);
    expect(
      MANTENIMIENTO_SCHEMA.safeParse({ ...VALID, apellidoMecanico: '' }).success,
    ).toBe(false);
  });

  it('rechaza sin vehículo ni tipo de mantenimiento seleccionados', () => {
    const sinVehiculo = MANTENIMIENTO_SCHEMA.safeParse({ ...VALID, vehiculoID: '' });
    const sinTipo = MANTENIMIENTO_SCHEMA.safeParse({
      ...VALID,
      tipoMantenimientoID: '',
    });
    expect(sinVehiculo.success).toBe(false);
    expect(sinTipo.success).toBe(false);
  });

  it('rechaza sin fecha de mantenimiento o con fecha inválida', () => {
    expect(
      MANTENIMIENTO_SCHEMA.safeParse({ ...VALID, fechaHoraMantenimiento: null })
        .success,
    ).toBe(false);
    expect(
      MANTENIMIENTO_SCHEMA.safeParse({
        ...VALID,
        fechaHoraMantenimiento: 'no-es-fecha',
      }).success,
    ).toBe(false);
  });

  it('permite descripción vacía / ausente (opcional en el DTO)', () => {
    const { descripcion: _omit, ...sinDescripcion } = VALID;
    expect(MANTENIMIENTO_SCHEMA.safeParse(sinDescripcion).success).toBe(true);
  });
});
