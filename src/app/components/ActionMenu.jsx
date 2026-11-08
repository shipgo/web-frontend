import { Fragment } from 'react';
import { ActionIcon, Button, Menu } from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons-react';

/**
 * Menú de tres puntos para acciones secundarias/destructivas.
 *
 * `actions` es una lista plana de `{ label, icon?, color?, disabled?, onClick?,
 * dividerBefore? }`. Si se pasa `primary` (misma forma + `loading`), se muestra
 * como botón visible a la izquierda del menú ("acción visible + resto en Menu").
 *
 * @param {Object} props
 * @param {Array<{label: string, icon?: import('react').ReactNode, color?: string,
 *   disabled?: boolean, onClick?: () => void, dividerBefore?: boolean}>} props.actions
 * @param {{label: string, icon?: import('react').ReactNode, onClick?: () => void,
 *   disabled?: boolean, loading?: boolean, variant?: string, color?: string}} [props.primary]
 *   Acción visible junto al menú.
 * @param {string} [props.ariaLabel] aria-label del botón de tres puntos.
 * @param {string} [props.position] Posición del dropdown (default `top-end`, pensado para barras inferiores).
 */
const ActionMenu = ({ actions = [], primary, ariaLabel = 'Más acciones', position = 'top-end' }) => (
  <>
    {primary && (
      <Button
        variant={primary.variant ?? 'default'}
        color={primary.color}
        leftSection={primary.icon}
        onClick={primary.onClick}
        disabled={primary.disabled}
        loading={primary.loading}
      >
        {primary.label}
      </Button>
    )}
    {actions.length > 0 && (
      <Menu shadow="md" position={position} withinPortal>
        <Menu.Target>
          <ActionIcon variant="default" size={44} aria-label={ariaLabel}>
            <IconDotsVertical size={20} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {actions.map((a) => (
            <Fragment key={a.label}>
              {a.dividerBefore && <Menu.Divider />}
              <Menu.Item
                mih={44}
                color={a.color}
                leftSection={a.icon}
                disabled={a.disabled}
                onClick={a.onClick}
              >
                {a.label}
              </Menu.Item>
            </Fragment>
          ))}
        </Menu.Dropdown>
      </Menu>
    )}
  </>
);

export default ActionMenu;
