import { IconDeviceMobile } from '@tabler/icons-react';
import { Button, Center, EmptyState } from '@mantine/core';

import { useAuthStore } from '@stores/auth.store';

/**
 * Pantalla que ven en la web los roles que sólo operan por app mobile
 * (`ROLE_CHOFER`, `ROLE_CARGA` — ver `CONTRACTS.md §3`). Se muestra sin
 * `Navbar`/`Header` de gestión.
 */
const MobileOnlyScreen = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <Center h="100vh" p="xl">
      <EmptyState mih="17rem">
        <EmptyState.Indicator>
          <IconDeviceMobile size={50} color="var(--mantine-color-dimmed)" />
        </EmptyState.Indicator>
        <EmptyState.Title>Usá la app móvil</EmptyState.Title>
        <EmptyState.Description>
          Tu cuenta no tiene acceso al panel web de ShipGo. Descargá la app móvil para continuar.
        </EmptyState.Description>
        <EmptyState.Actions>
          <Button variant="subtle" onClick={logout}>
            Cerrar sesión
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </Center>
  );
};

export default MobileOnlyScreen;
