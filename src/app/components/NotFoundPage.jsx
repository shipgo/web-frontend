import { Link } from 'wouter';
import { IconError404 } from '@tabler/icons-react';
import { Button, Center, EmptyState } from '@mantine/core';

/**
 * Página 404 genérica (SHG-FE-100): fallback para cualquier ruta inexistente,
 * tanto dentro del layout autenticado (`routes/index.jsx` → `ProtectedRoutes`,
 * Navbar visible) como en el catch-all público (deslogueado, sin AppShell).
 * "Volver al inicio" linkea siempre a `/`: `RootRoute` ya resuelve el destino
 * correcto según sesión/rol (landing pública, Home o el portal CUSTOMER).
 */
const NotFoundPage = () => (
  <Center mih="100dvh" p="xl" style={{ overflowX: 'hidden' }}>
    <EmptyState mih="17rem">
      <EmptyState.Indicator>
        <IconError404 size={50} color="var(--mantine-color-dimmed)" />
      </EmptyState.Indicator>
      <EmptyState.Title>Página no encontrada</EmptyState.Title>
      <EmptyState.Description>
        La página que buscás no existe o fue movida.
      </EmptyState.Description>
      <EmptyState.Actions>
        <Button component={Link} to="/" w={{ base: '100%', sm: 'auto' }} mih={{ base: 44, sm: 'auto' }}>
          Volver al inicio
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  </Center>
);

export default NotFoundPage;
