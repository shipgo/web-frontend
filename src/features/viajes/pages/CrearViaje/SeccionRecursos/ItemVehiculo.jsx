import { Box, NumberFormatter, Stack, Text, Tooltip } from "@mantine/core";

import ProgressBar from "@components/ProgressBar";

import { IconAlertCircle } from "@tabler/icons-react";

const ItemVehiculo = ({ vehicle, pesoTotal }) => {
  return (
    <>
      <Box mr="auto">
        <Text size="sm" fw="500">
          {vehicle.patente}
        </Text>

        <Text size="sm" c="dimmed">
          {vehicle.modelo}
        </Text>
      </Box>

      {vehicle.capacidad < pesoTotal && (
        <Tooltip label="Capacidad insuficiente">
          <IconAlertCircle color="red" size={20} />
        </Tooltip>
      )}

      <Stack w="35%" gap="0.25rem">
        <Text size="sm" fw="500" c="dimmed">
          <NumberFormatter suffix=" kg" value={pesoTotal} /> /{" "}
          <NumberFormatter value={vehicle.capacidad} suffix=" kg" />
        </Text>

        <ProgressBar
          inverseColor
          usedValue={pesoTotal}
          maxValue={vehicle.capacidad}
        />
      </Stack>
    </>
  );
};

export default ItemVehiculo;
