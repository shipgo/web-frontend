import {
  Badge,
  Box,
  Group,
  NumberFormatter,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconCircleMinus } from "@tabler/icons-react";

const ItemPaquete = ({
  item,
  shouldRemove = false,
  isIncludedInTrip = false,
}) => {
  return (
    <>
      <Box mr="auto">
        <Group gap="xs">
          <Text size="sm" fw="500">
            {item.id}
          </Text>

          {isIncludedInTrip && (
            <Badge size="md" variant="light">
              Incluido
            </Badge>
          )}
        </Group>
        <Text size="sm" c="gray.6">
          {item.direccion}, {item.localidad}, {item.provincia}
        </Text>
      </Box>

      <Text size="sm" c="gray.6">
        <NumberFormatter
          suffix=" kg"
          value={item.peso}
          thousandSeparator="."
          decimalScale={2}
          decimalSeparator=","
        />
      </Text>

      {shouldRemove && (
        <ThemeIcon variant="transparent" color="gray.5">
          <IconCircleMinus />
        </ThemeIcon>
      )}
    </>
  );
};

export default ItemPaquete;
