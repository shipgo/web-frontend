import {
  Badge,
  Flex,
  Group,
  NumberFormatter,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import { IconMapPin } from "@tabler/icons-react";

const ItemPaquete = ({ item, onRemove, isIncludedInTrip = false }) => {
  return (
    <>
      <Stack gap="0.25rem" mr="auto">
        <Group gap="xs">
          <Text size="sm" fw="500">
            #{item.id}
          </Text>

          {isIncludedInTrip && (
            <Badge size="xs" variant="light">
              Incluido
            </Badge>
          )}
        </Group>

        <Flex align="center" gap="0.25rem" c="dimmed">
          <IconMapPin size={20} />
          <Text size="sm">
            {item.direccion}, {item.localidad}, {item.provincia}
          </Text>
        </Flex>
      </Stack>

      <Text size="sm" c="dimmed">
        <NumberFormatter suffix=" kg" value={item.peso} />
      </Text>

      {onRemove && (
        <ThemeIcon
          color="red"
          variant="transparent"
          style={{ cursor: "pointer" }}
          onClick={onRemove}
        >
          <IconTrash />
        </ThemeIcon>
      )}
    </>
  );
};

export default ItemPaquete;
