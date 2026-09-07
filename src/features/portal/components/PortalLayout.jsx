import { Link } from 'wouter';
import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconLogout, IconPackage } from '@tabler/icons-react';

import PublicLayout from '../../../app/layout/PublicLayout';
import { useAuth } from '@contexts/auth';
import { useAuthStore } from '@stores/auth.store';
import { PORTAL_HOME_PATH } from '@domain/roles';

// `~` = ruta absoluta desde la raíz: estos links se renderizan dentro del nest
// `/portal`, donde un `href` sin `~` se resolvería relativo al base.
const PORTAL_HOME_HREF = `~${PORTAL_HOME_PATH}`;

/**
 * Layout del portal CUSTOMER (`SHG-FE-026`). Envuelve `PublicLayout` (branding
 * ShipGo, sin AppShell de admin) y le agrega a la derecha del header el nombre
 * del cliente + un menú con "Cerrar sesión".
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
const PortalLayout = ({ children }) => {
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);

  const nombre = user?.getFullName?.().trim() || user?.email || 'Mi cuenta';

  const headerRight = (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <UnstyledButton aria-label="Menú de la cuenta">
          <Group gap="xs" wrap="nowrap">
            <Avatar radius="xl" size="sm" color="blue">
              {user?.getInitials?.() || null}
            </Avatar>
            <Text size="sm" fw={500} visibleFrom="xs" lineClamp={1}>
              {nombre}
            </Text>
            <IconChevronDown size={16} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{user?.email}</Menu.Label>
        <Menu.Item
          component={Link}
          href={PORTAL_HOME_HREF}
          leftSection={<IconPackage size={16} />}
        >
          Mis envíos
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={() => logout()}
        >
          Cerrar sesión
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <PublicLayout homeHref={PORTAL_HOME_HREF} headerRight={headerRight}>
      {children}
    </PublicLayout>
  );
};

export default PortalLayout;
