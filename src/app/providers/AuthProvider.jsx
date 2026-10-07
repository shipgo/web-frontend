import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@stores/auth.store";
import { AuthContext } from "@contexts/auth";
import { landingPathFor } from "@domain/roles";
import { isProtectedPath } from "@utils/protectedPaths";
import { Center, Loader } from "@mantine/core";

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

  // Redirigir a login si no está autenticado y la ruta exige sesión. Una ruta
  // pública o desconocida no redirige: `AppRoutes` muestra la 404 (SHG-FE-104).
  useEffect(() => {
    if (isInitialized && !isLoading) {
      const currentPath = window.location.pathname;

      if (!isAuthenticated && isProtectedPath(currentPath)) {
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
