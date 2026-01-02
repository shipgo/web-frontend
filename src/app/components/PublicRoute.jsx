import { Redirect } from 'wouter';
import { Center, Loader } from '@mantine/core';

import { useAuth } from '@contexts/auth';

const PublicRoute = ({ children, redirect = "/" }) => {
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
    return <Redirect to={redirect} replace />;
  }

  return children;
};

export default PublicRoute;
