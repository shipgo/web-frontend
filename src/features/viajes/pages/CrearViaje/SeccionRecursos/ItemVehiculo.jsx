import { Badge, Box, NumberFormatter, Stack, Text, Tooltip } from "@mantine/core";

import ProgressBar from "@components/ProgressBar";

import { IconAlertCircle } from "@tabler/icons-react";

/**
 * @param {{ vehicle: Object, pesoTotal: number, motivoNoDisponible?: string }} props
 *   `motivoNoDisponible`: si viene, el vehículo no se puede elegir (SHG-FE-118): se
 *   muestra el motivo en lugar de la barra de capacidad.
 */
const ItemVehiculo = ({ vehicle, pesoTotal, motivoNoDisponible }) => {
  const capacidad = vehicle.pesoMaximo ?? 0;
  const modeloLabel =
    [vehicle.modelo?.marca?.nombre, vehicle.modelo?.nombre]
      .filter(Boolean)
      .join(" ") || "Sin modelo";

  if (motivoNoDisponible) {
    return (
      <>
        <Box mr="auto" opacity={0.6}>
          <Text size="sm" fw="500">
            {vehicle.patente}
          </Text>

          <Text size="sm" c="dimmed">
            {modeloLabel}
          </Text>
        </Box>

        <Badge
          color="orange"
          variant="light"
          radius="md"
          style={{ textTransform: "none" }}
        >
          {motivoNoDisponible}
        </Badge>
      </>
    );
  }

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
