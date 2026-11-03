import { formatDireccion } from '@domain/format';

/**
 * Coords `[lng, lat]` de una parada (`RecorridoDTO`): la parada es o un punto
 * de entrega (`puntoEntrega`) o una sucursal destino (`sucursalDestino`,
 * XOR — ver `CONTRACTS.md §8`), cada uno con su propio `latitud`/`longitud`
 * (directo en `PuntoEntregaDTO`, o anidado en `sucursalDestino.puntoEntrega`
 * para `SucursalDTO`). `null` si por algún motivo faltan coordenadas.
 */
export const coordsDeRecorrido = (recorrido) => {
  const punto = recorrido?.puntoEntrega ?? recorrido?.sucursalDestino?.puntoEntrega;
  if (!punto || punto.latitud == null || punto.longitud == null) return null;
  return [punto.longitud, punto.latitud];
};

/** Dirección legible de una parada: la del punto de entrega, o el nombre de la sucursal destino. */
export const direccionDeRecorrido = (recorrido) =>
  recorrido?.puntoEntrega
    ? formatDireccion(recorrido.puntoEntrega)
    : recorrido?.sucursalDestino?.nombre ?? '—';

/** Recorridos de un viaje, ordenados por `orden` y con sus coords resueltas. */
export const ordenarParadas = (recorridos = []) =>
  recorridos
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((recorrido) => ({ ...recorrido, coords: coordsDeRecorrido(recorrido) }));
