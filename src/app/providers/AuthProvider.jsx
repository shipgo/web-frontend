import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@stores/auth.store";
import { AuthContext } from "@contexts/auth";
import { landingPathFor } from "@domain/roles";
import { Center, Loader } from "@mantine/core";

// Rutas públicas que no requieren autenticación (SHG-FE-023 / SHG-FE-025 /
// SHG-FE-026 / SHG-FE-044). El match es por `startsWith`, así que
// `/recuperar-cuenta/:token`, `/tracking/:codigo` y `/registro/verificar`
// también quedan cubiertos. `/portal/ingresar` es la ÚNICA excepción pública
// dentro de `/portal` (entrada dedicada del customer, SHG-FE-044): el resto de
// `/portal/**` NO es público, requiere sesión de CUSTOMER (`PortalRoute`).
const PUBLIC_ROUTES = [
  "/login",
  "/recuperar-cuenta",
  "/tracking",
  "/registro",
  "/portal/ingresar",
];

// La raíz (`/`, SHG-FE-044) es pública EXACTA (no prefijo): es la landing sin
// sesión; con sesión, `RootRoute` (`app/routes/index.jsx`) delega en el home
// por rol. No puede ir en `PUBLIC_ROUTES` como prefijo porque `startsWith("/")`
// matchearía absolutamente todas las rutas.
const isPublicRoute = (path) =>
  path === "/" || PUBLIC_ROUTES.some((route) => path.startsWith(route));

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

      if (!isAuthenticated && !isPublicRoute(currentPath)) {
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
