import { formatDireccion } from "@domain/format";

import { coordsDePunto } from "../CrearViaje/SeccionEnvios/utils";

export const vehiculoLabel = (vehiculo) =>
  [vehiculo.patente, vehiculo.modelo?.nombre].filter(Boolean).join(" - ");

export const choferLabel = (chofer) =>
  [chofer.nombre, chofer.apellido].filter(Boolean).join(" ") ||
  chofer.username ||
  `Chofer ${chofer.id}`;

/**
 * Arma el `enviosIncluidos` inicial del form (mismo shape que produce
 * `ListadoEnviosPendientes.handleOnSelectedAction` en `CrearViaje`, ver
 * `CrearViaje/SeccionEnvios/utils.js#getGroupProperties`) a partir de los
 * `recorridos` de un `ViajeDTO` ya persistido — así `EditarViaje` puede
 * reusar `SeccionEnvios`/`SeccionResumen` de `CrearViaje` sin cambios
 * (`SHG-FE-049`).
 *
 * Cada `recorrido` es 1:1 con una entrada del Map, igual que en creación:
 * `puntoEntrega` XOR `sucursalDestino` (verificado contra el backend real,
 * `GET /api/viaje/{id}` — el que no aplica ni siquiera viene como key en el
 * JSON, no sólo `null`). El `envio` anidado en cada `detalleRecorridos` ya
 * viene con `destino`/`peso`/`codigoSeguimiento` completos (mismo `EnvioDTO`
 * que devuelve `GET /api/envio/paraViaje`), así que no hace falta un fetch
 * aparte para poblar `ItemPaquete`.
 *
 * Se ordena por `orden` (igual que `DetalleViaje/components/RecorridosList.jsx`)
 * para que el orden de paradas coincida con el que ya tiene el viaje.
 */
export const buildEnviosIncluidosFromRecorridos = (recorridos = []) => {
  const ordenados = [...recorridos].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0),
  );

  const entries = ordenados.map((recorrido) => {
    const esSucursal = Boolean(recorrido.sucursalDestino);

    const packages = new Map(
      (recorrido.detalleRecorridos || [])
        .map((detalle) => detalle.envio)
        .filter(Boolean)
        .map((envio) => [envio.id, envio]),
    );

    const key = esSucursal
      ? `sucursal_${recorrido.sucursalDestino.id}`
      : `local_${recorrido.puntoEntrega?.id}`;

    const label = esSucursal
      ? recorrido.sucursalDestino.nombre
      : formatDireccion(recorrido.puntoEntrega, { completa: true });

    const coords = esSucursal
      ? coordsDePunto(recorrido.sucursalDestino.puntoEntrega)
      : coordsDePunto(recorrido.puntoEntrega);

    return [
      key,
      {
        puntoEntregaID: esSucursal ? null : (recorrido.puntoEntrega?.id ?? null),
        sucursalDestinoID: esSucursal ? recorrido.sucursalDestino.id : null,
        label,
        coords,
        packages,
      },
    ];
  });

  return new Map(entries);
};

/**
 * Envíos ya asignados al viaje (aplanados, sin agrupar por recorrido) — se
 * usan como `extraEnviosPendientes` de `SeccionEnvios` para que sigan
 * apareciendo en "Envíos pendientes" (marcados "Incluido") aunque su estado
 * (`asignado_a_viaje`) los excluya de `GET /api/envio/paraViaje`.
 */
export const extraerEnviosDeRecorridos = (recorridos = []) => {
  const vistos = new Map();
  recorridos.forEach((recorrido) => {
    (recorrido.detalleRecorridos || []).forEach((detalle) => {
      if (detalle.envio && !vistos.has(detalle.envio.id)) {
        vistos.set(detalle.envio.id, detalle.envio);
      }
    });
  });
  return Array.from(vistos.values());
};
