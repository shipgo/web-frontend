import { Redirect } from 'wouter';
import { Center, Loader } from '@mantine/core';

import { useAuth } from '@contexts/auth';
import { isCustomer, ADMIN_HOME_PATH } from '@domain/roles';

/**
 * Guarda de las rutas del portal CUSTOMER (`/portal/**`, SHG-FE-026).
 *
 * - Sin sesión → `/login`.
 * - Con sesión pero NO CUSTOMER (SUPERUSER / ADMIN) → su panel (`/`).
 * - CUSTOMER → pasa.
 *
 * `~` fuerza rutas absolutas: este componente vive dentro de un grupo `nest`.
 */
const PortalRoute = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect to="~/login" replace />;
  }

  if (!isCustomer(user)) {
    return <Redirect to={`~${ADMIN_HOME_PATH}`} replace />;
  }

  return children;
};

export default PortalRoute;
