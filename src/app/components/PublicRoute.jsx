import { Redirect } from 'wouter';
import { Center, Loader } from '@mantine/core';

import { useAuth } from '@contexts/auth';
import { landingPathFor } from '@domain/roles';

/**
 * Guarda de las pantallas públicas que NO deben verse con sesión activa
 * (login, recuperación de cuenta, registro). Si ya hay sesión, redirige.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.redirect]  Destino explícito. Si se omite, se usa el
 *   home que corresponde al rol (`landingPathFor`): CUSTOMER → portal,
 *   SU/AD → panel de admin.
 */
const PublicRoute = ({ children, redirect }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Mostrar loader mientras verifica autenticación
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Si ya está autenticado, redirigir al home o ruta especificada
  if (isAuthenticated && user) {
    return <Redirect to={redirect ?? landingPathFor(user)} replace />;
  }

  return children;
};

export default PublicRoute;
