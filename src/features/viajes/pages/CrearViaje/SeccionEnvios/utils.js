export const getGroupProperties = (selectedPackages) => {
  const packagesByCategory = Array.from(selectedPackages.entries());

  const groupLabels = packagesByCategory.map(
    ([, { sucursal }]) => sucursal?.nombre ?? "Entrega local",
  );

  const groupedPackages = packagesByCategory.map(([, values]) =>
    Array.from(values.packages.values()),
  );

  const packagesFlat = groupedPackages.flat();
  const groupCounts = groupedPackages.map((list) => list.length);

  return { groupCounts, groupLabels, packagesFlat };
};
