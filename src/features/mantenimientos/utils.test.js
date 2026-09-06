import { describe, expect, it } from 'vitest';

import {
  buildMantenimientoFormValues,
  buildMantenimientoReqDTO,
  toLocalDateTimeString,
} from './utils';

describe('toLocalDateTimeString', () => {
  it('formatea un Date como LocalDateTime sin sufijo Z ni milisegundos', () => {
    // 10 de marzo de 2026, 14:30 hora local
    const fecha = new Date(2026, 2, 10, 14, 30, 0);
    expect(toLocalDateTimeString(fecha)).toBe('2026-03-10T14:30:00');
  });

  it('no convierte a UTC (no corre la hora de pared)', () => {
    const resultado = toLocalDateTimeString(new Date(2026, 0, 1, 0, 0, 0));
    expect(resultado).toBe('2026-01-01T00:00:00');
    expect(resultado).not.toMatch(/Z$/);
    expect(resultado).not.toMatch(/\.\d{3}/);
  });

  it('devuelve null para valores nulos o inválidos', () => {
    expect(toLocalDateTimeString(null)).toBeNull();
    expect(toLocalDateTimeString(undefined)).toBeNull();
    expect(toLocalDateTimeString('no-es-fecha')).toBeNull();
  });
});

describe('buildMantenimientoReqDTO', () => {
  const values = {
    nombreMecanico: '  Juan  ',
    apellidoMecanico: 'Pérez',
    vehiculoID: '7',
    tipoMantenimientoID: '3',
    fechaHoraMantenimiento: new Date(2026, 5, 15, 9, 0, 0),
    descripcion: '  Cambio de aceite  ',
  };

  it('arma el payload alineado a MantenimientoReqDTO (ids numéricos, fecha LocalDateTime)', () => {
    expect(buildMantenimientoReqDTO(values)).toEqual({
      nombreMecanico: 'Juan',
      apellidoMecanico: 'Pérez',
      vehiculoID: 7,
      tipoMantenimientoID: 3,
      fechaHoraMantenimiento: '2026-06-15T09:00:00',
      descripcion: 'Cambio de aceite',
    });
  });

  it('manda descripcion null cuando está vacía', () => {
    const payload = buildMantenimientoReqDTO({ ...values, descripcion: '   ' });
    expect(payload.descripcion).toBeNull();
  });

  it('no incluye fechaHoraRegistro salvo que se pase explícitamente', () => {
    expect(buildMantenimientoReqDTO(values)).not.toHaveProperty('fechaHoraRegistro');
    const payload = buildMantenimientoReqDTO(values, {
      fechaHoraRegistro: '2026-06-01T12:00:00',
    });
    expect(payload.fechaHoraRegistro).toBe('2026-06-01T12:00:00');
  });
});

describe('buildMantenimientoFormValues', () => {
  it('mapea el MantenimientoDTO a los values del form (ids string, fecha Date)', () => {
    const dto = {
      nombreMecanico: 'Ana',
      apellidoMecanico: 'López',
      vehiculo: { id: 12, patente: 'AB123CD' },
      tipoMantenimiento: { id: 4, nombre: 'Frenos' },
      fechaHoraMantenimiento: '2026-06-15T09:00:00',
      descripcion: 'Revisión general',
    };

    const values = buildMantenimientoFormValues(dto);

    expect(values.nombreMecanico).toBe('Ana');
    expect(values.vehiculoID).toBe('12');
    expect(values.tipoMantenimientoID).toBe('4');
    expect(values.fechaHoraMantenimiento).toBeInstanceOf(Date);
    expect(values.descripcion).toBe('Revisión general');
  });

  it('tolera campos ausentes', () => {
    const values = buildMantenimientoFormValues({});
    expect(values).toEqual({
      nombreMecanico: '',
      apellidoMecanico: '',
      vehiculoID: '',
      tipoMantenimientoID: '',
      fechaHoraMantenimiento: null,
      descripcion: '',
    });
  });

  it('es inversa de buildMantenimientoReqDTO en los campos compartidos', () => {
    const dto = {
      nombreMecanico: 'Ana',
      apellidoMecanico: 'López',
      vehiculo: { id: 12 },
      tipoMantenimiento: { id: 4 },
      fechaHoraMantenimiento: '2026-06-15T09:00:00',
      descripcion: 'Revisión general',
    };
    const payload = buildMantenimientoReqDTO(buildMantenimientoFormValues(dto));
    expect(payload).toMatchObject({
      nombreMecanico: 'Ana',
      apellidoMecanico: 'López',
      vehiculoID: 12,
      tipoMantenimientoID: 4,
      fechaHoraMantenimiento: '2026-06-15T09:00:00',
      descripcion: 'Revisión general',
    });
  });
});
