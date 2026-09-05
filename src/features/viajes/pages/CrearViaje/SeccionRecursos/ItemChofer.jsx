import { Avatar, Stack, Text } from "@mantine/core";

import { formatTelefono } from "@domain/format";

const ItemChofer = ({ chofer }) => {
  const nombreCompleto =
    [chofer.nombre, chofer.apellido].filter(Boolean).join(" ") ||
    chofer.username;

  return (
    <>
      <Avatar name={nombreCompleto} />
      <Stack gap="0">
        <Text size="sm" fw="500">
          {nombreCompleto}
        </Text>
        <Text size="sm" c="dimmed">
          {chofer.email || formatTelefono(chofer.prefijo, chofer.telefono)}
        </Text>
      </Stack>
    </>
  );
};

export default ItemChofer;
