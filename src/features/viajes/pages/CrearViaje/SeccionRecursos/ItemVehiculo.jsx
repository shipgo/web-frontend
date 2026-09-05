import { Box, NumberFormatter, Stack, Text, Tooltip } from "@mantine/core";

import ProgressBar from "@components/ProgressBar";

import { IconAlertCircle } from "@tabler/icons-react";

const ItemVehiculo = ({ vehicle, pesoTotal }) => {
  const capacidad = vehicle.pesoMaximo ?? 0;
  const modeloLabel =
    [vehicle.modelo?.marca?.nombre, vehicle.modelo?.nombre]
      .filter(Boolean)
      .join(" ") || "Sin modelo";

  return (
    <>
      <Box mr="auto">
        <Text size="sm" fw="500">
          {vehicle.patente}
        </Text>

        <Text size="sm" c="dimmed">
          {modeloLabel}
        </Text>
      </Box>

      {capacidad < pesoTotal && (
        <Tooltip label="Capacidad insuficiente">
          <IconAlertCircle color="red" size={20} />
        </Tooltip>
      )}

      <Stack w="35%" gap="0.25rem">
        <Text size="sm" fw="500" c="dimmed">
          <NumberFormatter suffix=" kg" value={pesoTotal} /> /{" "}
          <NumberFormatter value={capacidad} suffix=" kg" />
        </Text>

        <ProgressBar inverseColor usedValue={pesoTotal} maxValue={capacidad || 1} />
      </Stack>
    </>
  );
};

export default ItemVehiculo;
