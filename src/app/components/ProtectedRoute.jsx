import { Redirect } from 'wouter';
import { Center, Loader } from '@mantine/core';

import { useAuth } from '@contexts/auth';
import { hasAnyRole } from '@domain/roles';

/**
 * Guarda de ruta: exige autenticación y, opcionalmente, uno de los `roles`
 * pasados (ver `CONTRACTS.md §3`). Sin `roles`, sólo exige estar autenticado.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Mostrar loader mientras verifica autenticación
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Redirigir a login si no está autenticado.
  // `~` fuerza una ruta absoluta: este componente se usa dentro de grupos de
  // rutas anidados (`nest`), donde un `to` sin `~` se resolvería relativo al
  // `base` de esa ruta (p. ej. "/sucursales/login") en vez de la raíz real.
  if (!isAuthenticated || !user) {
    return <Redirect to="~/login" replace />;
  }

  // Redirigir a home si el rol del usuario no está habilitado para esta ruta
  if (roles?.length && !hasAnyRole(user, roles)) {
    return <Redirect to="~/" replace />;
  }

  return children;
};

export default ProtectedRoute;
