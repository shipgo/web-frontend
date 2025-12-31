import { Card, Group, Text, Title, Box, Stack, ThemeIcon } from "@mantine/core";
import { useMap } from "@mantine/hooks";
import { IconPackage } from "@tabler/icons-react";

import { PACKAGES } from "../constants/packages";

import EnviosPendientes from "./EnviosPendientes";
import EnviosSeleccionados from "./EnviosSeleccionados";

// const getPendingPackages = ({ packagesList, selectedPackages }) => {
//   let pendingPackages = new Map(packagesList);

//   for (const items of selectedPackages.values()) {
//     pendingPackages = mapDifference(pendingPackages, items);
//   }

//   return Array.from(pendingPackages.values());
// };

const SeccionEnvios = () => {
  const packagesInTripByCategory = useMap();

  const packagesInTrip = Array.from(packagesInTripByCategory.values()).flat();

  const handlePackagesAction = ({ items, action }) => {
    const prevItems = packagesInTripByCategory.get(action) ?? new Map();
    const newItems = new Map([...prevItems, ...items]);
    packagesInTripByCategory.set(action, newItems);
  };

  const handlePackageRemove = ({ category, packageId }) => {
    const prevItems = packagesInTripByCategory.get(category) ?? new Map();
    prevItems.delete(packageId);

    if (prevItems.size === 0) {
      packagesInTripByCategory.delete(category);
      return;
    }

    packagesInTripByCategory.set(category, prevItems);
  };

  return (
    <Card component={Stack} h="700">
      <Group gap="0.75rem">
        <ThemeIcon size="xl" variant="light">
          <IconPackage />
        </ThemeIcon>

        <Box>
          <Title order={4}>Selección de envíos</Title>
          <Text c="gray.6" size="sm">
            Seleccioná los envíos que se incluirán en el viaje
          </Text>
        </Box>
      </Group>

      <Group justify="space-between" flex={1}>
        <EnviosPendientes
          packagesInTrip={packagesInTrip}
          onPackagesAction={handlePackagesAction}
        />

        <EnviosSeleccionados
          selectedPackages={packagesInTripByCategory}
          onPackageRemove={handlePackageRemove}
        />
      </Group>
    </Card>
  );
};

export default SeccionEnvios;
