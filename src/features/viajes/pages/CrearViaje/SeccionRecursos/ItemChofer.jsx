import { Avatar, Stack, Text } from "@mantine/core";

const ItemChofer = ({ chofer }) => {
  return (
    <>
      <Avatar name={chofer.nombre} />
      <Stack gap="0">
        <Text size="sm" fw="500">
          {chofer.nombre}
        </Text>
        <Text size="sm" c="dimmed">
          {chofer.telefono}
        </Text>
      </Stack>
    </>
  );
};

export default ItemChofer;
