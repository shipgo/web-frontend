import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { MANTENIMIENTO_SCHEMA, buildMantenimientoSchema } from './schema';

const VALID = {
  nombreMecanico: 'Juan',
  apellidoMecanico: 'Pérez',
  vehiculoID: '7',
  tipoMantenimientoID: '3',
  fechaHoraMantenimiento: dayjs().add(2, 'day').hour(9).minute(0).second(0).toDate(),
  fechaHoraFin: dayjs().add(3, 'day').hour(9).minute(0).second(0).toDate(),
  descripcion: '',
};

const paths = (result) => result.error.issues.map((i) => i.path[0]);

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

  it('rechaza sin fecha de inicio o con fecha inválida', () => {
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

  it('rechaza sin fecha de fin', () => {
    const r = MANTENIMIENTO_SCHEMA.safeParse({ ...VALID, fechaHoraFin: null });
    expect(r.success).toBe(false);
    expect(paths(r)).toEqual(['fechaHoraFin']);
  });

  it('rechaza fin igual o anterior al inicio, con el error en fechaHoraFin', () => {
    const igual = MANTENIMIENTO_SCHEMA.safeParse({
      ...VALID,
      fechaHoraFin: VALID.fechaHoraMantenimiento,
    });
    const anterior = MANTENIMIENTO_SCHEMA.safeParse({
      ...VALID,
      fechaHoraFin: dayjs(VALID.fechaHoraMantenimiento).subtract(1, 'hour').toDate(),
    });
    for (const r of [igual, anterior]) {
      expect(r.success).toBe(false);
      expect(paths(r)).toContain('fechaHoraFin');
    }
  });

  it('rechaza un inicio en el pasado', () => {
    const r = MANTENIMIENTO_SCHEMA.safeParse({
      ...VALID,
      fechaHoraMantenimiento: dayjs().subtract(1, 'day').toDate(),
      fechaHoraFin: dayjs().add(1, 'day').toDate(),
    });
    expect(r.success).toBe(false);
    expect(paths(r)).toContain('fechaHoraMantenimiento');
  });

  it('en edición conserva el inicio original aunque ya haya pasado (mantenimiento en curso)', () => {
    const inicio = dayjs().subtract(1, 'day').toDate();
    const values = { ...VALID, fechaHoraMantenimiento: inicio };
    expect(
      buildMantenimientoSchema({ inicioOriginal: inicio }).safeParse(values).success,
    ).toBe(true);
    expect(MANTENIMIENTO_SCHEMA.safeParse(values).success).toBe(false);
  });
});
