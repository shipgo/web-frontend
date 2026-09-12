import { lazy, Suspense, useEffect } from 'react';
import { Switch, Route, Redirect } from 'wouter';

import LoginPage from '@features/login';

import Layout from '../layout';
import PublicLayout from '../layout/PublicLayout';
import ProtectedRoute from '@components/ProtectedRoute';
import PublicRoute from '@components/PublicRoute';
import PortalRoute from '@components/PortalRoute';
import MobileOnlyScreen from '@components/MobileOnlyScreen';
import { useAuth, useIsAuthenticated } from '@contexts/auth';
import {
  hasAnyRole,
  isCustomer,
  PORTAL_BASE_PATH,
  PORTAL_HOME_PATH,
  ROLE_SUPERUSER,
  ROLES_WEB,
} from '@domain/roles';
import { buildLoginRedirectTo } from '@utils/redirect';
import { Center, Loader, useMantineColorScheme } from '@mantine/core';

const RecuperarCuentaPage = lazy(() => import('@features/login/RecuperarCuenta'));
const RecuperarCuentaTokenPage = lazy(
  () => import('@features/login/RecuperarCuentaToken'),
);
const HomePage = lazy(() => import('@features/home'));
const LandingPage = lazy(() =>
  import('@features/landing').then((m) => ({ default: m.LandingPage })),
);
const TrackingPublicoPage = lazy(() =>
  import('@features/tracking').then((m) => ({ default: m.TrackingPublicoPage })),
);
const RegistroPage = lazy(() =>
  import('@features/portal').then((m) => ({ default: m.RegistroPage })),
);
const VerificarCuentaPage = lazy(() =>
  import('@features/portal').then((m) => ({ default: m.VerificarCuentaPage })),
);
const PortalLayout = lazy(() =>
  import('@features/portal').then((m) => ({ default: m.PortalLayout })),
);
const PortalRoutes = lazy(() => import('./portal.routes'));
const MapaPage = lazy(() => import('@features/mapa'));
const MantenimientosRoutes = lazy(() => import('@features/mantenimientos'));
const DashboardRoutes = lazy(() => import('./dashboard.routes'));
const EnviosRoutes = lazy(() => import('./envios.routes'));
const ViajesRoutes = lazy(() => import('./viajes.routes'));
const UsuariosRoutes = lazy(() => import('./usuarios.routes'));
const SucursalesRoutes = lazy(() => import('./sucursales.routes'));
const VehiculosRoutes = lazy(() => import('@features/vehiculos'));

const RouteFallback = () => (
  <Center h='60vh'>
    <Loader size='lg' />
  </Center>
);

const ProtectedRoutes = () => {
  const isAuthenticated = useIsAuthenticated();
  const { user } = useAuth();
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (isAuthenticated) setColorScheme('auto');
  }, [isAuthenticated]);

  // Acceso directo (link compartido) a una ruta protegida sin sesión: manda a
  // `/login` preservando el destino en `?redirect=` (SHG-FE-054) en vez de
  // perderlo — ver `@utils/redirect`. `ProtectedRoutes` es el fallback que
  // matchea cualquier ruta no pública (última `<Route>` de `AppRoutes`, sin
  // `path`), así que acá es donde realmente cae ese caso — la guarda interna
  // de `ProtectedRoute` (por rol) sólo se monta ya autenticado.
  if (!isAuthenticated) {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    return <Redirect to={buildLoginRedirectTo(currentPath)} replace />;
  }

  // CUSTOMER: sólo el portal (CONTRACTS.md §7). Si cae en cualquier ruta de
  // gestión, se lo manda al portal.
  if (isCustomer(user)) return <Redirect to={PORTAL_HOME_PATH} replace />;

  // CHOFER/CARGA sólo operan por app mobile (CONTRACTS.md §3): sin navbar de
  // gestión, sólo la pantalla "usá la app".
  if (!hasAnyRole(user, ROLES_WEB)) {
    return <MobileOnlyScreen />;
  }

  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path='/' component={HomePage} />
          <Route path='/mapa'>
            <ProtectedRoute roles={ROLES_WEB}>
              <MapaPage />
            </ProtectedRoute>
          </Route>
          <Route path='/dashboard' nest>
            <ProtectedRoute roles={ROLES_WEB}>
              <DashboardRoutes />
            </ProtectedRoute>
          </Route>
          <Route path='/envios' nest>
            <ProtectedRoute roles={ROLES_WEB}>
              <EnviosRoutes />
            </ProtectedRoute>
          </Route>
          <Route path='/viajes' nest>
            <ProtectedRoute roles={ROLES_WEB}>
              <ViajesRoutes />
            </ProtectedRoute>
          </Route>
          <Route path='/usuarios' nest>
            <ProtectedRoute roles={ROLES_WEB}>
              <UsuariosRoutes />
            </ProtectedRoute>
          </Route>
          {/* Sucursales/Empresa: endpoints SUPERUSER-only (CONTRACTS.md §3). */}
          <Route path='/sucursales' nest>
            <ProtectedRoute roles={[ROLE_SUPERUSER]}>
              <SucursalesRoutes />
            </ProtectedRoute>
          </Route>
          <Route path='/vehiculos' nest>
            <ProtectedRoute roles={ROLES_WEB}>
              <VehiculosRoutes />
            </ProtectedRoute>
          </Route>
          <Route path='/mantenimientos' nest>
            <ProtectedRoute roles={ROLES_WEB}>
              <MantenimientosRoutes />
            </ProtectedRoute>
          </Route>
        </Switch>
      </Suspense>
    </Layout>
  );
};

/**
 * Ruta raíz (`/`, SHG-FE-044). Sin sesión → landing pública de marketing. Con
 * sesión → delega en `ProtectedRoutes`, que ya resuelve el home por rol
 * (HomePage para SUPERUSER/ADMIN en `/`; CUSTOMER se redirige al portal; sólo
 * mobile ve `MobileOnlyScreen`) — evita repetir esa lógica acá.
 */
const RootRoute = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <RouteFallback />;

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LandingPage />
      </Suspense>
    );
  }

  return <ProtectedRoutes />;
};

const AppRoutes = () => {
  return (
    <Switch>
      {/* Landing pública (SHG-FE-044). Debe matchear ANTES del fallback
          `<Route component={ProtectedRoutes} />` para poder mostrar la landing
          sin sesión; `RootRoute` delega en `ProtectedRoutes` cuando sí hay
          sesión, así que el comportamiento autenticado no cambia. */}
      <Route path='/' component={RootRoute} />
      <Route path='/login' component={LoginPage} />
      {/* Entrada dedicada del customer (SHG-FE-044): mismo `LoginPage` que
          `/login`, sólo cambia el copy (`variant="customer"`) — el destino
          post-login sigue siendo `landingPathFor(user)` según el rol real. Va
          ANTES del nest guardado de `PORTAL_BASE_PATH` para no quedar atrapada
          por `PortalRoute` (que exige sesión CUSTOMER: no se puede loguear
          "adentro" de una guarda que pide estar ya logueado). */}
      <Route path='/portal/ingresar'>
        <PublicRoute>
          <LoginPage variant='customer' />
        </PublicRoute>
      </Route>
      {/* Tracking público / guest (SHG-FE-025, CONTRACTS.md §7). FUERA de
          `ProtectedRoutes`: sin login y sin el AppShell de admin — usa
          `PublicLayout` (que reutilizará el portal CUSTOMER de SHG-FE-026).
          `restclient.js` y `AuthProvider` tratan `/tracking` como ruta pública
          (no redirige a `/login` si no hay sesión). `:codigo?` opcional:
          `/tracking` muestra el input, `/tracking/:codigo` autoconsulta. */}
      <Route path='/tracking/:codigo?'>
        <PublicLayout>
          <Suspense fallback={<RouteFallback />}>
            <TrackingPublicoPage />
          </Suspense>
        </PublicLayout>
      </Route>
      {/* Rutas públicas de recuperación de cuenta (SHG-FE-023). `restclient.js` y
          `AuthProvider` ya tratan cualquier path bajo `/recuperar-cuenta` como
          público; `PublicRoute` además saca al Home si ya hay sesión. */}
      <Route path='/recuperar-cuenta/:token'>
        <PublicRoute>
          <Suspense fallback={<RouteFallback />}>
            <RecuperarCuentaTokenPage />
          </Suspense>
        </PublicRoute>
      </Route>
      <Route path='/recuperar-cuenta'>
        <PublicRoute>
          <Suspense fallback={<RouteFallback />}>
            <RecuperarCuentaPage />
          </Suspense>
        </PublicRoute>
      </Route>
      {/* Portal CUSTOMER (SHG-FE-026, CONTRACTS.md §7). `/registro` +
          `/registro/verificar` son públicos (whitelist en `AuthProvider` y
          `restclient` por `startsWith`); `/portal/**` requiere sesión de
          CUSTOMER (`PortalRoute`). Layout: `PublicLayout` (envuelto en
          `PortalLayout` para el portal), NUNCA el AppShell de admin. */}
      <Route path='/registro'>
        <PublicRoute>
          <PublicLayout>
            <Suspense fallback={<RouteFallback />}>
              <RegistroPage />
            </Suspense>
          </PublicLayout>
        </PublicRoute>
      </Route>
      <Route path='/registro/verificar'>
        <PublicRoute>
          <PublicLayout>
            <Suspense fallback={<RouteFallback />}>
              <VerificarCuentaPage />
            </Suspense>
          </PublicLayout>
        </PublicRoute>
      </Route>
      <Route path={PORTAL_BASE_PATH} nest>
        <PortalRoute>
          <Suspense fallback={<RouteFallback />}>
            <PortalLayout>
              <PortalRoutes />
            </PortalLayout>
          </Suspense>
        </PortalRoute>
      </Route>
      <Route component={ProtectedRoutes} />
    </Switch>
  );
};

export default AppRoutes;
