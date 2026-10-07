import { describe, expect, it } from 'vitest';

import { ENVIOS_CSV_COLUMNS } from '@features/envios/pages/ListaEnvios/listaEnvios.csv';
import { VIAJES_CSV_COLUMNS } from '@features/viajes/pages/ListaViajes/listaViajes.csv';

// SHG-FE-111: horas límite (23:30 ART, cruce de medianoche) en las exportaciones.
const col = (cols, header) => cols.find((c) => c.header === header);

describe('CSV con hora local de Argentina', () => {
  it('envíos: la fecha de alta sale a las 23:30 del mismo día', () => {
    const envio = {
      historialEstado: [{ estado: 'creado', fechaHoraInicio: '2026-10-07T23:30:15.123' }],
    };
    expect(col(ENVIOS_CSV_COLUMNS, 'Fecha de alta').value(envio)).toBe('07/10/2026 23:30');
  });

  it('envíos: cruce de medianoche y 9 dígitos de fracción', () => {
    const envio = {
      historialEstado: [{ estado: 'creado', fechaHoraInicio: '2026-10-08T00:00:00.000000000' }],
    };
    expect(col(ENVIOS_CSV_COLUMNS, 'Fecha de alta').value(envio)).toBe('08/10/2026 00:00');
  });

  it('viajes: inicio y fin planificados al cruzar el día', () => {
    const viaje = {
      fechaHoraInicioPlanificada: '2026-10-07T23:30:00.000',
      fechaHoraFinPlanificada: '2026-10-08T01:15:00.000',
    };
    expect(col(VIAJES_CSV_COLUMNS, 'Inicio planificado').value(viaje)).toBe('07/10/2026 23:30');
    expect(col(VIAJES_CSV_COLUMNS, 'Fin planificado').value(viaje)).toBe('08/10/2026 01:15');
  });
});
