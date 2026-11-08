import { ActionIcon, Button, Menu } from '@mantine/core';
import { IconDotsVertical, IconHelp } from '@tabler/icons-react';

import { useIsMobile } from '@hooks/useIsMobile';

export const HELP_URL = 'https://shipgo.gitbook.io/manual';

/**
 * Acciones de encabezado compartidas por `PageHeader` y `PageBreadcrumbsHeader`.
 *
 * - Escritorio: `children` + `primaryAction` (Button) + `secondaryActions`
 *   (Button subtle) + "Ayuda".
 * - Mobile: `primaryAction` pasa a ActionIcon con `aria-label`; `secondaryActions`
 *   y "Ayuda" van a un menú de tres puntos. `children` (legacy) siguen
 *   renderizándose tal cual, así que una pantalla no migrada no pierde botones.
 *
 * Forma de una acción: `{ label, icon?, onClick?, loading?, disabled?, ...rest }`;
 * `rest` (ej. `component`, `to`, `href`, `target`) se reenvía al Button/ActionIcon.
 */
const PageHeaderActions = ({ children, primaryAction, secondaryActions = [], showHelp = true }) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    const { label, icon, ...primaryRest } = primaryAction ?? {};
    return (
      <>
        {children}
        {primaryAction && (
          <Button leftSection={icon} {...primaryRest}>
            {label}
          </Button>
        )}
        {secondaryActions.map(({ label: l, icon: i, ...rest }) => (
          <Button key={l} variant="subtle" leftSection={i} {...rest}>
            {l}
          </Button>
        ))}
        {showHelp && (
          <Button variant="subtle" component="a" href={HELP_URL} target="_blank">
            Ayuda
          </Button>
        )}
      </>
    );
  }

  const { label, icon, loading, ...primaryRest } = primaryAction ?? {};

  return (
    <>
      {children}
      {primaryAction && (
        <ActionIcon size={44} variant="filled" aria-label={label} loading={loading} {...primaryRest}>
          {icon}
        </ActionIcon>
      )}
      {(secondaryActions.length > 0 || showHelp) && (
        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <ActionIcon size={44} variant="subtle" c="dimmed" aria-label="Más opciones">
              <IconDotsVertical size={20} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {secondaryActions.map(({ label: l, icon: i, loading: ld, ...rest }) => (
              <Menu.Item key={l} mih={44} leftSection={i} disabled={ld || rest.disabled} {...rest}>
                {l}
              </Menu.Item>
            ))}
            {showHelp && (
              <Menu.Item
                mih={44}
                leftSection={<IconHelp size={16} />}
                component="a"
                href={HELP_URL}
                target="_blank"
              >
                Ayuda
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      )}
    </>
  );
};

export default PageHeaderActions;
