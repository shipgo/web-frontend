import { Redirect } from 'wouter';
import { Center, Loader } from '@mantine/core';

import { useAuth } from '@contexts/auth';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Mostrar loader mientras verifica autenticación
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated || !user) {
    return <Redirect to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
