import { Fragment } from "react";
import { ActionIcon, Menu } from "@mantine/core";
import { IconDotsVertical } from "@tabler/icons-react";

/**
 * actions: Array of items or groups
 *
 * Flat item:   { label, icon, color?, disabled?, dividerBefore? }
 * Group:       { name, items: [{ label, icon, color?, disabled? }] }
 */
const RowActionsMenu = ({ actions = [], width = "max-content" }) => (
  <Menu
    shadow="md"
    width={width}
    styles={{ dropdown: { minWidth: 180 } }}
    position="bottom-end"
  >
    <Menu.Target>
      <ActionIcon variant="subtle" c="dimmed" size="input-sm">
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
              {entry.items.map(({ label, icon, color, disabled, onClick }) => (
                <Menu.Item
                  key={label}
                  color={color}
                  leftSection={icon}
                  disabled={disabled}
                  onClick={onClick}
                >
                  {label}
                </Menu.Item>
              ))}
            </Fragment>
          );
        }

        return (
          <Fragment key={entry.label}>
            {entry.dividerBefore && <Menu.Divider />}
            <Menu.Item
              color={entry.color}
              leftSection={entry.icon}
              disabled={entry.disabled}
              onClick={entry.onClick}
            >
              {entry.label}
            </Menu.Item>
          </Fragment>
        );
      })}
    </Menu.Dropdown>
  </Menu>
);

export default RowActionsMenu;
