import { Fragment, useState } from "react";
import { ActionIcon, Divider, Drawer, Menu, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { IconDotsVertical } from "@tabler/icons-react";

import { useIsMobile } from "@hooks/useIsMobile";

/**
 * actions: Array of items or groups
 *
 * Flat item:   { label, icon, color?, disabled?, dividerBefore?, tooltip? }
 * Group:       { name, items: [{ label, icon, color?, disabled?, tooltip? }] }
 *
 * `tooltip` (SHG-FE-097): mensaje mostrado sólo mientras `disabled` es
 * `true` — explica por qué la acción no está disponible (p. ej. "Localizar"
 * en Envíos, sin viaje trackeable). Se ignora si `disabled` es falsy.
 *
 * Mobile (< sm): en vez del menú desplegable abre una hoja inferior
 * (`Drawer position="bottom"`) con filas de 48 px; el `tooltip` de una acción
 * deshabilitada se muestra como texto secundario bajo la etiqueta. Escritorio: igual que siempre.
 */
const MenuItemEntry = ({ label, icon, color, disabled, onClick, tooltip }) => {
  const item = (
    <Menu.Item color={color} leftSection={icon} disabled={disabled} onClick={onClick}>
      {label}
    </Menu.Item>
  );

  if (!disabled || !tooltip) return item;

  // Un `Menu.Item` deshabilitado es un `<button disabled>` real: el navegador
  // no dispara eventos de puntero sobre él, así que un `Tooltip` puesto
  // directo ahí nunca vería el hover. Se envuelve en un `<span>` (patrón
  // estándar de Mantine para tooltips en elementos deshabilitados) que sí
  // recibe el hover y dispara el tooltip.
  return (
    <Tooltip label={tooltip} position="left" withArrow multiline maw={220}>
      <span>{item}</span>
    </Tooltip>
  );
};

const SheetRow = ({ label, icon, color, disabled, onClick, tooltip, onDone }) => (
  <UnstyledButton
    disabled={disabled}
    onClick={() => {
      onDone();
      onClick?.();
    }}
    mih={48}
    px="md"
    py="xs"
    w="100%"
    c={color ? `var(--mantine-color-${color}-filled)` : undefined}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "var(--mantine-spacing-sm)",
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
    }}
  >
    {icon}
    <Stack gap={0}>
      <Text span inherit>{label}</Text>
      {disabled && tooltip && <Text size="xs" c="dimmed">{tooltip}</Text>}
    </Stack>
  </UnstyledButton>
);

const MobileSheet = ({ actions, ariaLabel }) => {
  const [opened, setOpened] = useState(false);
  const close = () => setOpened(false);

  return (
    <>
      <ActionIcon variant="subtle" c="dimmed" size={44} aria-label={ariaLabel} onClick={() => setOpened(true)}>
        <IconDotsVertical size={20} />
      </ActionIcon>
      <Drawer
        opened={opened}
        onClose={close}
        position="bottom"
        size="auto"
        title={ariaLabel}
        radius="md"
        styles={{
          content: { maxHeight: "85dvh" },
          body: { padding: 0, paddingBottom: "env(safe-area-inset-bottom)" },
        }}
      >
        {actions.map((entry, index) => {
          if (entry.name) {
            return (
              <Fragment key={entry.name}>
                {index > 0 && <Divider />}
                <Text size="xs" fw={600} c="dimmed" px="md" pt="xs" tt="uppercase">{entry.name}</Text>
                {entry.items.map((item) => (
                  <SheetRow key={item.label} {...item} onDone={close} />
                ))}
              </Fragment>
            );
          }
          return (
            <Fragment key={entry.label}>
              {entry.dividerBefore && <Divider />}
              <SheetRow {...entry} onDone={close} />
            </Fragment>
          );
        })}
      </Drawer>
    </>
  );
};

const RowActionsMenu = ({ actions = [], width = "max-content", ariaLabel = "Más acciones" }) => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileSheet actions={actions} ariaLabel={ariaLabel} />;
  return <DesktopMenu actions={actions} width={width} ariaLabel={ariaLabel} />;
};

const DesktopMenu = ({ actions = [], width = "max-content", ariaLabel = "Más acciones" }) => (
  <Menu
    shadow="md"
    width={width}
    styles={{ dropdown: { minWidth: 180 } }}
    position="bottom-end"
  >
    <Menu.Target>
      <ActionIcon variant="subtle" c="dimmed" size="input-sm" aria-label={ariaLabel}>
        <IconDotsVertical size={18} />
      </ActionIcon>
    </Menu.Target>

    <Menu.Dropdown>
      {actions.map((entry, index) => {
        if (entry.name) {
          return (
            <Fragment key={entry.name}>
              {index > 0 && <Menu.Divider />}
              <Menu.Label>{entry.name}</Menu.Label>
              {entry.items.map((item) => (
                <MenuItemEntry key={item.label} {...item} />
              ))}
            </Fragment>
          );
        }

        return (
          <Fragment key={entry.label}>
            {entry.dividerBefore && <Menu.Divider />}
            <MenuItemEntry {...entry} />
          </Fragment>
        );
      })}
    </Menu.Dropdown>
  </Menu>
);

export default RowActionsMenu;
