/**
 * Coords `[lng, lat]` de un punto (`PuntoEntregaDTO`, directo o el
 * `puntoEntrega` anidado de una `SucursalDTO`), o `null` si faltan. Mismo
 * criterio que `features/mapa/utils/recorridos.js#coordsDeRecorrido` (misma
 * forma de dato, `latitud`/`longitud` planos).
 */
export const coordsDePunto = (punto) => {
  if (!punto || punto.latitud == null || punto.longitud == null) return null;
  return [punto.longitud, punto.latitud];
};

/**
 * Cada entrada de `enviosIncluidos` ya es 1:1 con un recorrido (`label` para
 * mostrar + `coords` para el mapa + `packages` = envíos de ese recorrido),
 * ver `ListadoEnviosPendientes.handleOnSelectedAction`. El orden de los
 * arrays devueltos = orden de inserción del Map = orden actual de las
 * paradas (ver `moverParada`).
 */
export const getGroupProperties = (enviosIncluidos) => {
  const entries = Array.from(enviosIncluidos.entries());

  const groupKeys = entries.map(([key]) => key);
  const groupLabels = entries.map(([, { label }]) => label);
  const groupCoords = entries.map(([, { coords }]) => coords ?? null);
  const groupedPackages = entries.map(([, { packages }]) =>
    Array.from(packages.values()),
  );

  const packagesFlat = groupedPackages.flat();
  const groupCounts = groupedPackages.map((list) => list.length);

  return { groupCounts, groupKeys, groupLabels, groupCoords, packagesFlat };
};

/**
 * Copia de `enviosIncluidos` con la parada en `fromIndex` movida a
 * `toIndex` (resto de las paradas se corre para acomodarla, no swap). El
 * orden de inserción del Map resultante pasa a ser el nuevo orden del
 * recorrido — `buildEnviosPuntoEntrega` (`CrearViaje/utils.js`) lo respeta
 * 1:1 en el `enviosPuntoEntrega` que se postea (`SHG-FE-048`).
 *
 * Índices fuera de rango (o iguales) devuelven el mismo Map sin tocar, para
 * que los botones subir/bajar de `PaquetesTimeline` puedan llamar esto sin
 * chequear límites de antemano.
 */
export const moverParada = (enviosIncluidos, fromIndex, toIndex) => {
  const entries = Array.from(enviosIncluidos.entries());
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= entries.length ||
    toIndex >= entries.length
  ) {
    return enviosIncluidos;
  }

  const [moved] = entries.splice(fromIndex, 1);
  entries.splice(toIndex, 0, moved);
  return new Map(entries);
};
