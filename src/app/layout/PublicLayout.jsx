import { Link } from 'wouter';
import { AppShell, Anchor, Box, Group, Image, Text } from '@mantine/core';

import logo from '/src/assets/logoipsum-custom-logo.svg';
import { useAuth } from '@contexts/auth';
import { landingPathFor } from '@domain/roles';

/**
 * Layout de las pantallas públicas (sin login): tracking guest (`SHG-FE-025`) y,
 * más adelante, el portal CUSTOMER (`SHG-FE-026`, que reutiliza este layout).
 *
 * A diferencia de `layout/index.jsx` (panel de admin) NO trae navbar de gestión,
 * header con búsqueda ni menú de usuario. Sólo branding de ShipGo, contenido
 * centrado y responsive-first (la mayoría del tráfico guest entra desde el
 * celular).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.homeHref]  Destino explícito del wordmark del header
 *   (ej. `PortalLayout` lo fija al home del portal, siempre con sesión
 *   CUSTOMER). Si se omite (SHG-FE-054), el wordmark linkea a la landing
 *   pública (`/`) sin sesión, o al home por rol (`landingPathFor`) si ya hay
 *   sesión — algunas pantallas con este layout (ej. `/tracking`) son
 *   accesibles con o sin sesión.
 * @param {number|string} [props.maxWidth=760]   Ancho máximo del contenido.
 * @param {React.ReactNode} [props.headerRight]  Slot opcional a la derecha del header.
 */
const PublicLayout = ({
  children,
  homeHref,
  maxWidth = 760,
  headerRight = null,
}) => {
  const { user, isAuthenticated } = useAuth();
  const resolvedHomeHref =
    homeHref ?? (isAuthenticated ? landingPathFor(user) : '/');

  return (
    <AppShell header={{ height: 64 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Anchor component={Link} href={resolvedHomeHref} aria-label="ShipGo — inicio">
            <Image src={logo} h={32} w="auto" fit="contain" alt="ShipGo" />
          </Anchor>
          {headerRight}
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Box
          mx="auto"
          px="md"
          py={{ base: 'lg', sm: 'xl' }}
          style={{ maxWidth, width: '100%' }}
        >
          {children}
        </Box>

        <Box component="footer" ta="center" py="xl" px="md">
          <Text size="xs" c="dimmed">
            ShipGo · Seguimiento de envíos
          </Text>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default PublicLayout;
