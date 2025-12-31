import { Box, NumberFormatter, Text, ThemeIcon, Tooltip } from "@mantine/core";

import { IconAlertCircle } from "@tabler/icons-react";

const ItemVehiculo = ({ vehicle }) => {
  return (
    <>
      <Box mr="auto">
        <Text size="sm" fw="500">
          {vehicle.patente}
        </Text>

        <Text size="sm" c="gray.6">
          <NumberFormatter
            suffix=" kg"
            prefix="Capacidad: "
            value={vehicle.capacidad}
            thousandSeparator="."
            decimalScale={0}
            decimalSeparator=","
          />
        </Text>
      </Box>

      {vehicle.capacidad < 5000 && (
        <Tooltip label="Capacidad insuficiente">
          <ThemeIcon variant="transparent" color="red">
            <IconAlertCircle />
          </ThemeIcon>
        </Tooltip>
      )}
    </>
  );
};

export default ItemVehiculo;
