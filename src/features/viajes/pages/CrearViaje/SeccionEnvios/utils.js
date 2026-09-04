/**
 * Cada entrada de `enviosIncluidos` ya es 1:1 con un recorrido (`label` para
 * mostrar + `packages` = envíos de ese recorrido), ver
 * `ListadoEnviosPendientes.handleOnSelectedAction`.
 */
export const getGroupProperties = (enviosIncluidos) => {
  const entries = Array.from(enviosIncluidos.entries());

  const groupLabels = entries.map(([, { label }]) => label);
  const groupedPackages = entries.map(([, { packages }]) =>
    Array.from(packages.values()),
  );

  const packagesFlat = groupedPackages.flat();
  const groupCounts = groupedPackages.map((list) => list.length);

  return { groupCounts, groupLabels, packagesFlat };
};
