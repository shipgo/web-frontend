import { describe, expect, it } from 'vitest';

import {
  getCategoriaTotal,
  getEnviosTotal,
  getFlotaTotal,
  isDonutVacio,
  isSerieVacia,
  mapDesvioViajes,
  mapEnviosDonut,
  mapFlotaDonut,
  mapResumenToKpis,
  mapVolumenPorCategoria,
  mapVolumenPorDia,
  mapVolumenPorSucursal,
} from './dashboard.mappers';

// Shape real de `GET /api/dashboard/resumen` (SHG-BE-003 / DashboardResumenDTO).
const RESUMEN = {
  periodo: { desde: '2026-09-01', hasta: '2026-09-07' },
  sucursalId: null,
  envios: {
    total: 20,
    porEstado: {
      creado: 3,
      en_sucursal: 4,
      asignado_a_viaje: 0,
      en_vehiculo: 1,
      en_camino: 2,
      entregado: 8,
      rechazado: 2,
    },
  },
  viajes: {
    total: 10,
    porEstado: {
      creado: 0,
      planificado: 3,
      en_proceso_de_carga: 1,
      en_camino: 2,
      finalizado: 3,
      cancelado: 1,
      con_problemas: 0,
    },
    activos: 3,
    planificados: 3,
    finalizados: 3,
  },
  flota: {
    total: 6,
    porEstado: {
      disponible: 3,
      asignado_a_viaje: 1,
      en_viaje: 2,
      en_service: 0,
      fuera_de_servicio: 0,
    },
  },
  incidencias: { viajesConProblemas: 1, enviosRechazados: 2, total: 3 },
  entregasATiempo: {
    entregadosConViajeAsociado: 8,
    cantidadATiempo: 6,
    porcentaje: 75.0,
  },
};

// Shape real de `GET /api/dashboard/series` (SHG-BE-003 / DashboardSeriesDTO).
const SERIES = {
  periodo: { desde: '2026-09-01', hasta: '2026-09-03' },
  sucursalId: null,
  volumenPorDia: [
    { fecha: '2026-09-01', cantidad: 5 },
    { fecha: '2026-09-02', cantidad: 0 },
    { fecha: '2026-09-03', cantidad: 7 },
  ],
  volumenPorSucursal: [
    { sucursalId: 1, sucursal: 'Centro', cantidad: 8 },
    { sucursalId: 2, sucursal: 'Norte', cantidad: 4 },
  ],
  volumenPorCategoria: [
    { categoriaId: 1, categoria: 'Documentos', cantidad: 6 },
    { categoriaId: 2, categoria: 'Electrónica', cantidad: 0 },
    { categoriaId: 3, categoria: 'Frágil', cantidad: 3 },
  ],
  desvioViajes: [
    {
      viajeId: 10,
      patente: 'AB123CD',
      fechaHoraFinPlanificada: '2026-09-02T17:00:00',
      fechaHoraFin: '2026-09-02T17:25:00',
      desvioMinutos: 25,
    },
    {
      viajeId: 11,
      patente: null,
      fechaHoraFinPlanificada: '2026-09-03T12:00:00',
      fechaHoraFin: '2026-09-03T11:50:00',
      desvioMinutos: -10,
    },
  ],
};

describe('mapResumenToKpis', () => {
  it('devuelve null sin resumen', () => {
    expect(mapResumenToKpis(undefined)).toBeNull();
  });

  it('mapea envíos: total, entregados y pendientes = total - entregados - rechazados', () => {
    const { envios } = mapResumenToKpis(RESUMEN);
    expect(envios).toEqual({ value: 20, entregados: 8, pendientes: 10 });
  });

  it('mapea viajes activos con su desglose', () => {
    const { viajesActivos } = mapResumenToKpis(RESUMEN);
    expect(viajesActivos).toEqual({ value: 3, planificados: 3, finalizados: 3 });
  });

  it('mapea incidencias', () => {
    const { incidencias } = mapResumenToKpis(RESUMEN);
    expect(incidencias).toEqual({
      value: 3,
      viajesConProblemas: 1,
      enviosRechazados: 2,
    });
  });

  it('mapea entregas a tiempo (porcentaje, aTiempo=cantidadATiempo, base=entregadosConViajeAsociado)', () => {
    const { entregasATiempo } = mapResumenToKpis(RESUMEN);
    expect(entregasATiempo).toEqual({ porcentaje: 75, aTiempo: 6, base: 8 });
  });

  it('entregasATiempo.porcentaje = null cuando el backend manda null', () => {
    const { entregasATiempo } = mapResumenToKpis({
      ...RESUMEN,
      entregasATiempo: {
        entregadosConViajeAsociado: 0,
        cantidadATiempo: 0,
        porcentaje: null,
      },
    });
    expect(entregasATiempo.porcentaje).toBeNull();
  });

  it('tolera campos faltantes sin explotar', () => {
    const kpis = mapResumenToKpis({});
    expect(kpis.envios).toEqual({ value: 0, entregados: 0, pendientes: 0 });
    expect(kpis.entregasATiempo.porcentaje).toBeNull();
  });
});

describe('donuts del resumen', () => {
  it('mapFlotaDonut usa labels/colores canónicos y descarta estados en 0', () => {
    const data = mapFlotaDonut(RESUMEN);
    expect(data).toEqual([
      { name: 'Disponible', value: 3, color: 'green.5' },
      { name: 'Asignado a viaje', value: 1, color: 'blue.5' },
      { name: 'En viaje', value: 2, color: 'orange.5' },
    ]);
    expect(getFlotaTotal(RESUMEN)).toBe(6);
  });

  it('mapEnviosDonut mapea envios.porEstado y descarta ceros', () => {
    const data = mapEnviosDonut(RESUMEN);
    expect(data.map((d) => d.name)).not.toContain('Asignado a viaje');
    expect(data.find((d) => d.name === 'Entregado')).toEqual({
      name: 'Entregado',
      value: 8,
      color: 'green.5',
    });
    expect(getEnviosTotal(RESUMEN)).toBe(20);
  });
});

describe('series → charts', () => {
  it('mapVolumenPorDia formatea la fecha a DD/MM y conserva los días en 0', () => {
    expect(mapVolumenPorDia(SERIES)).toEqual([
      { fecha: '01/09', cantidad: 5 },
      { fecha: '02/09', cantidad: 0 },
      { fecha: '03/09', cantidad: 7 },
    ]);
  });

  it('mapVolumenPorSucursal → { sucursal, cantidad }', () => {
    expect(mapVolumenPorSucursal(SERIES)).toEqual([
      { sucursal: 'Centro', cantidad: 8 },
      { sucursal: 'Norte', cantidad: 4 },
    ]);
  });

  it('mapVolumenPorCategoria descarta categorías en 0 y asigna color de la paleta', () => {
    const data = mapVolumenPorCategoria(SERIES);
    expect(data).toEqual([
      { name: 'Documentos', value: 6, color: 'blue.5' },
      { name: 'Frágil', value: 3, color: 'teal.5' },
    ]);
    expect(getCategoriaTotal(SERIES)).toBe(9);
  });

  it('mapDesvioViajes usa la patente (o #id de fallback) y desvioMinutos con signo', () => {
    expect(mapDesvioViajes(SERIES)).toEqual([
      { viaje: 'AB123CD', desvio: 25 },
      { viaje: '#11', desvio: -10 },
    ]);
  });

  it('mapea a [] cuando falta la sección', () => {
    expect(mapVolumenPorDia({})).toEqual([]);
    expect(mapDesvioViajes(undefined)).toEqual([]);
  });
});

describe('helpers de empty', () => {
  it('isSerieVacia: true si no hay filas o todas están en 0', () => {
    expect(isSerieVacia([])).toBe(true);
    expect(isSerieVacia([{ cantidad: 0 }, { cantidad: 0 }])).toBe(true);
    expect(isSerieVacia([{ cantidad: 0 }, { cantidad: 1 }])).toBe(false);
  });

  it('isDonutVacio: true si no hay segmentos con valor', () => {
    expect(isDonutVacio([])).toBe(true);
    expect(isDonutVacio([{ value: 0 }])).toBe(true);
    expect(isDonutVacio([{ value: 2 }])).toBe(false);
  });
});
