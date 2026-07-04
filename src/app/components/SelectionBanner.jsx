import { Button, Group, Menu, Paper, Text } from "@mantine/core";
import {
  IconChevronDown,
  IconDownload,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";

const SelectionBanner = ({ count, singular, plural, onClear }) => {
  if (count === 0) return null;

  const label = count === 1 ? `1 ${singular}` : `${count} ${plural}`;

  return (
    <Paper
      withBorder
      shadow="md"
      p="xs"
      px="md"
      radius="md"
      pos="fixed"
      bottom={24}
      left="50%"
      miw={360}
      style={{ transform: "translateX(-50%)", zIndex: 200 }}
    >
      <Group justify="space-between" gap="xl">
        <Text size="sm" fw={500}>
          {label}
        </Text>

        <Group gap="xs">
          <Button variant="subtle" size="xs" onClick={onClear}>
            Deseleccionar
          </Button>

          <Menu shadow="md" width="max-content" position="top-end">
            <Menu.Target>
              <Button
                variant="light"
                size="xs"
                rightSection={<IconChevronDown size={14} />}
              >
                Acciones
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />}>
                Editar seleccionados
              </Menu.Item>
              <Menu.Item leftSection={<IconDownload size={16} />}>
                Exportar seleccionados
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={16} />} color="red">
                Eliminar seleccionados
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  );
};

export default SelectionBanner;
