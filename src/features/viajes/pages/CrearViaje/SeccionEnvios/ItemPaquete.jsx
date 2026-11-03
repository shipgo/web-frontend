import { Badge, Flex, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconBuildingStore, IconMapPin, IconTrash } from "@tabler/icons-react";

import { formatPeso } from "@domain/format";

import { TIPO_ENTREGA } from "@features/envios/constants";
import { formatDestinoEnvio } from "@features/envios/utils";

const ItemPaquete = ({ item, onRemove, isIncludedInTrip = false }) => {
  const esRetiroSucursal = item.tipoEntrega === TIPO_ENTREGA.SUCURSAL;

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
          {esRetiroSucursal ? <IconBuildingStore size={20} /> : <IconMapPin size={20} />}
          <Text size="sm">{formatDestinoEnvio(item, { completa: true })}</Text>
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
