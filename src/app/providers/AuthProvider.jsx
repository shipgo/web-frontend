import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@stores/auth.store";
import { AuthContext } from "@contexts/auth";
import { landingPathFor } from "@domain/roles";
import { Center, Loader } from "@mantine/core";

// Rutas públicas que no requieren autenticación (SHG-FE-023 / SHG-FE-025 /
// SHG-FE-026). El match es por `startsWith`, así que `/recuperar-cuenta/:token`,
// `/tracking/:codigo` y `/registro/verificar` también quedan cubiertos.
// `/portal` NO es público: requiere sesión de CUSTOMER.
const PUBLIC_ROUTES = ["/login", "/recuperar-cuenta", "/tracking", "/registro"];

const AuthProvider = ({ children }) => {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, initUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initUser();
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [initUser]);

  // Redirigir a login si no está autenticado y no está en una ruta pública
  useEffect(() => {
    if (isInitialized && !isLoading) {
      const currentPath = window.location.pathname;
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        currentPath.startsWith(route)
      );

      if (!isAuthenticated && !isPublicRoute) {
        setLocation("/login");
      } else if (isAuthenticated && currentPath === "/login") {
        // Si ya está autenticado y está en login, redirigir al home que
        // corresponde al rol: CUSTOMER → portal, SU/AD → panel de admin.
        setLocation(landingPathFor(user));
      }
    }
  }, [isAuthenticated, isLoading, isInitialized, setLocation, user]);

  // Mostrar loader mientras se inicializa la autenticación
  if (!isInitialized || isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
