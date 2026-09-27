import { Fragment } from "react";
import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { IconDotsVertical } from "@tabler/icons-react";

/**
 * actions: Array of items or groups
 *
 * Flat item:   { label, icon, color?, disabled?, dividerBefore?, tooltip? }
 * Group:       { name, items: [{ label, icon, color?, disabled?, tooltip? }] }
 *
 * `tooltip` (SHG-FE-097): mensaje mostrado sólo mientras `disabled` es
 * `true` — explica por qué la acción no está disponible (p. ej. "Localizar"
 * en Envíos, sin viaje trackeable). Se ignora si `disabled` es falsy.
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

const RowActionsMenu = ({ actions = [], width = "max-content", ariaLabel = "Más acciones" }) => (
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
