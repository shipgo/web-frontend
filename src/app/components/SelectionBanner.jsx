import { Button, Group, Menu, Paper, Text } from "@mantine/core";
import {
  IconChevronDown,
  IconDownload,
  IconTrash,
} from "@tabler/icons-react";

/**
 * Banner flotante de selección múltiple (checkboxes de listado). El menú
 * "Acciones" sólo muestra los ítems para los que el listado pasó handler:
 * sin `onExport` no hay "Exportar seleccionados", sin `onDelete` no hay
 * "Eliminar seleccionados", y si no llega ninguno el menú ni se renderiza
 * (SHG-FE-095 — "Editar seleccionados" se sacó por completo, no había
 * `onClick` ni tiene sentido de producto todavía).
 */
const SelectionBanner = ({ count, singular, plural, onClear, onExport, onDelete }) => {
  if (count === 0) return null;

  const label = count === 1 ? `1 ${singular}` : `${count} ${plural}`;
  const hasActions = Boolean(onExport || onDelete);

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
      maw="calc(100vw - 2rem)"
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

          {hasActions && (
            <Menu shadow="md" width="max-content" position="top-end">
              <Menu.Target>
                {/* `c="var(--shg-button-text-primary)"`: ver ese token en
                    `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto
                    del color primario en `variant="light"` no llega a 4.5:1 en
                    dark mode (axe-core `color-contrast`, SHG-FE-070). */}
                <Button
                  variant="light"
                  size="xs"
                  rightSection={<IconChevronDown size={14} />}
                  c="var(--shg-button-text-primary)"
                >
                  Acciones
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {onExport && (
                  <Menu.Item leftSection={<IconDownload size={16} />} onClick={onExport}>
                    Exportar seleccionados
                  </Menu.Item>
                )}
                {onExport && onDelete && <Menu.Divider />}
                {onDelete && (
                  <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={onDelete}>
                    Eliminar seleccionados
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </Paper>
  );
};

export default SelectionBanner;
