import dayjs from 'dayjs';

import { ESTADO_ENVIO, ESTADO_VEHICULO } from '@domain/estados';

/**
 * Mapeo puro `respuesta del backend (SHG-BE-003) → shape que consume cada
 * componente de UI`. Sin side-effects: se testea en `dashboard.mappers.test.js`.
 *
 * - `resumen` → `DashboardResumenDTO` (`GET /api/dashboard/resumen`).
 * - `series`  → `DashboardSeriesDTO`  (`GET /api/dashboard/series`).
 */

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Paleta para donuts cuya categoría no tiene color canónico (por categoría de envío). */
export const DONUT_PALETTE = [
  'blue.5',
  'teal.5',
  'violet.5',
  'orange.5',
  'pink.5',
  'cyan.5',
  'lime.6',
  'grape.5',
];

// ===========================================================================
// resumen → KPIs
// ===========================================================================

/**
 * `DashboardResumenDTO` → datos de las 4 `KpiCard`.
 * @returns {null | {
 *   envios: { value:number, entregados:number, pendientes:number },
 *   viajesActivos: { value:number, planificados:number, finalizados:number },
 *   incidencias: { value:number, viajesConProblemas:number, enviosRechazados:number },
 *   entregasATiempo: { porcentaje:number|null, aTiempo:number, base:number },
 * }}
 */
export const mapResumenToKpis = (resumen) => {
  if (!resumen) return null;

  const envios = resumen.envios ?? {};
  const enviosPorEstado = envios.porEstado ?? {};
  const entregados = num(enviosPorEstado.entregado);
  const rechazados = num(enviosPorEstado.rechazado);
  const total = num(envios.total);

  const viajes = resumen.viajes ?? {};
  const incidencias = resumen.incidencias ?? {};
  const entregasATiempo = resumen.entregasATiempo ?? {};

  return {
    envios: {
      value: total,
      entregados,
      pendientes: Math.max(total - entregados - rechazados, 0),
    },
    viajesActivos: {
      value: num(viajes.activos),
      planificados: num(viajes.planificados),
      finalizados: num(viajes.finalizados),
    },
    incidencias: {
      value: num(incidencias.total),
      viajesConProblemas: num(incidencias.viajesConProblemas),
      enviosRechazados: num(incidencias.enviosRechazados),
    },
    entregasATiempo: {
      porcentaje:
        typeof entregasATiempo.porcentaje === 'number'
          ? entregasATiempo.porcentaje
          : null,
      aTiempo: num(entregasATiempo.cantidadATiempo),
      base: num(entregasATiempo.entregadosConViajeAsociado),
    },
  };
};

// ===========================================================================
// resumen → donuts
// ===========================================================================

const donutFromPorEstado = (porEstado, estadoMap) =>
  Object.entries(porEstado ?? {})
    .filter(([, value]) => num(value) > 0)
    .map(([estado, value]) => ({
      name: estadoMap[estado]?.label ?? estado,
      value: num(value),
      color: `${estadoMap[estado]?.color ?? 'gray'}.5`,
    }));

/** `resumen.flota.porEstado` → data de `FleetDonut`. */
export const mapFlotaDonut = (resumen) =>
  donutFromPorEstado(resumen?.flota?.porEstado, ESTADO_VEHICULO);

/** total de la flota (para el label central del donut). */
export const getFlotaTotal = (resumen) => num(resumen?.flota?.total);

/** `resumen.envios.porEstado` → data de `StatusDonut`. */
export const mapEnviosDonut = (resumen) =>
  donutFromPorEstado(resumen?.envios?.porEstado, ESTADO_ENVIO);

export const getEnviosTotal = (resumen) => num(resumen?.envios?.total);

// ===========================================================================
// series → charts
// ===========================================================================

/** `series.volumenPorDia` → `BarChart` de `VolumeChart` (`{ fecha, cantidad }`). */
export const mapVolumenPorDia = (series) =>
  (series?.volumenPorDia ?? []).map((punto) => ({
    fecha: dayjs(punto.fecha).format('DD/MM'),
    cantidad: num(punto.cantidad),
  }));

/** `series.volumenPorSucursal` → `BarChart` de `SucursalChart` (`{ sucursal, cantidad }`). */
export const mapVolumenPorSucursal = (series) =>
  (series?.volumenPorSucursal ?? []).map((item) => ({
    sucursal: item.sucursal ?? `#${item.sucursalId}`,
    cantidad: num(item.cantidad),
  }));

/** `series.volumenPorCategoria` → `DonutChart` de `CategoriaDonut` (`{ name, value, color }`). */
export const mapVolumenPorCategoria = (series) =>
  (series?.volumenPorCategoria ?? [])
    .filter((item) => num(item.cantidad) > 0)
    .map((item, i) => ({
      name: item.categoria ?? `#${item.categoriaId}`,
      value: num(item.cantidad),
      color: DONUT_PALETTE[i % DONUT_PALETTE.length],
    }));

export const getCategoriaTotal = (series) =>
  (series?.volumenPorCategoria ?? []).reduce((acc, i) => acc + num(i.cantidad), 0);

/**
 * `series.desvioViajes` → `BarChart` de `DesvioChart`. Una barra por viaje
 * finalizado con `desvioMinutos` (positivo = terminó tarde, negativo = adelantado).
 */
export const mapDesvioViajes = (series) =>
  (series?.desvioViajes ?? []).map((viaje) => ({
    viaje: viaje.patente ?? `#${viaje.viajeId}`,
    desvio: num(viaje.desvioMinutos),
  }));

// ===========================================================================
// helpers de "empty" por card
// ===========================================================================

export const isSerieVacia = (rows, key = 'cantidad') =>
  !rows || rows.length === 0 || rows.every((r) => num(r[key]) === 0);

export const isDonutVacio = (rows) =>
  !rows || rows.length === 0 || rows.every((r) => num(r.value) === 0);
