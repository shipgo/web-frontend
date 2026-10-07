import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@stores/auth.store";
import { AuthContext } from "@contexts/auth";
import { landingPathFor } from "@domain/roles";
import { isProtectedPath } from "@utils/protectedPaths";
import ConnectionErrorScreen from "@components/ConnectionErrorScreen";
import { Center, Loader } from "@mantine/core";

const AuthProvider = ({ children }) => {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, initUser, connectionError } =
    useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const initialize = useCallback(async () => {
    try {
      await initUser();
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsInitialized(true);
    }
  }, [initUser]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirigir a login si no está autenticado y la ruta exige sesión. Una ruta
  // pública o desconocida no redirige: `AppRoutes` muestra la 404 (SHG-FE-104).
  useEffect(() => {
    if (isInitialized && !isLoading) {
      const currentPath = window.location.pathname;

      if (connectionError) {
        // Sin conexión con la API no sabemos si hay sesión: no mandar a /login.
      } else if (!isAuthenticated && isProtectedPath(currentPath)) {
        setLocation("/login");
      } else if (isAuthenticated && currentPath === "/login") {
        // Si ya está autenticado y está en login, redirigir al home que
        // corresponde al rol: CUSTOMER → portal, SU/AD → panel de admin.
        setLocation(landingPathFor(user));
      }
    }
  }, [isAuthenticated, isLoading, isInitialized, connectionError, setLocation, user]);

  // Mostrar loader mientras se inicializa la autenticación
  if (!isInitialized || isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Bootstrap sin respuesta de la API (timeout / red / 5xx; SHG-FE-110): en una
  // ruta que exige sesión mostramos "No pudimos conectar" + Reintentar (no
  // sabemos si la sesión es válida, así que tampoco vamos a /login). Las rutas
  // públicas (landing, /tracking, /login, registro, 404) NO se bloquean: no
  // necesitan sesión y se renderizan como "no autenticado".
  if (connectionError && isProtectedPath(window.location.pathname)) {
    return <ConnectionErrorScreen kind={connectionError} onRetry={initialize} />;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
