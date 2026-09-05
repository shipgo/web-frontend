import { Badge, Flex, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconMapPin, IconTrash } from "@tabler/icons-react";

import { formatDireccion, formatPeso } from "@domain/format";

const ItemPaquete = ({ item, onRemove, isIncludedInTrip = false }) => {
  return (
    <>
      <Stack gap="0.25rem" mr="auto">
        <Group gap="xs">
          <Text size="sm" fw="500">
            {item.codigoSeguimiento ?? `#${item.id}`}
          </Text>

          {isIncludedInTrip && (
            <Badge size="xs" variant="light">
              Incluido
            </Badge>
          )}
        </Group>

        <Flex align="center" gap="0.25rem" c="dimmed">
          <IconMapPin size={20} />
          <Text size="sm">{formatDireccion(item.destino, { completa: true })}</Text>
        </Flex>
      </Stack>

      <Text size="sm" c="dimmed">
        {formatPeso(item.peso)}
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
