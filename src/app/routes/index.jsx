import { lazy, Suspense, useEffect } from 'react';
import { Switch, Route, Redirect, useLocation } from 'wouter';

import LoginPage from '@features/login';

import Layout from '../layout';
import PublicLayout from '../layout/PublicLayout';
import ProtectedRoute from '@components/ProtectedRoute';
import PublicRoute from '@components/PublicRoute';
import PortalRoute from '@components/PortalRoute';
import MobileOnlyScreen from '@components/MobileOnlyScreen';
import NotFoundPage from '@components/NotFoundPage';
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
const CatalogoVehiculosRoutes = lazy(() => import('./catalogoVehiculos.routes'));

const RouteFallback = () => (
  <Center h='60vh'>
    <Loader size='lg' />
  </Center>
);

// Clave por defecto que usa el `localStorageColorSchemeManager` interno de
// Mantine (no pasamos uno custom a `MantineProvider` en App.jsx) para
// persistir la preferencia de color scheme entre sesiones/navegaciones.
const MANTINE_COLOR_SCHEME_STORAGE_KEY = 'mantine-color-scheme-value';

/**
 * true si el usuario ya eligió explícitamente "claro" u "oscuro" (vía el
 * toggle de `Navbar`). Si nunca tocó el toggle, Mantine no tiene nada
 * persistido para esta clave (o vale 'auto') y debe seguir siguiendo al SO.
 */
const hasExplicitColorSchemePreference = () => {
  try {
    const stored = window.localStorage.getItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark';
  } catch {
    // localStorage no disponible (SSR, modo privado, etc.) → tratamos como
    // "sin preferencia explícita" y dejamos que gane el default 'auto'.
    return false;
  }
};

// SHG-FE-100: única fuente de verdad para las secciones protegidas — de acá
// se generan tanto las `<Route>` del `<Switch>` de `ProtectedRoutes` (más
// abajo) como los prefijos que usa `CatchAllRoute` para distinguir, sin
// sesión, un link directo a una ruta protegida real (redirige a
// `/login?redirect=`, SHG-FE-054) de una ruta inexistente (404 pública). No
// incluye `/`: tiene su propia `<Route>` sin `ProtectedRoute` acá abajo y su
// propia `<Route path='/' component={RootRoute}>` en `AppRoutes`.
const PROTECTED_SECTIONS = [
  { path: '/mapa', component: MapaPage },
  { path: '/dashboard', nest: true, component: DashboardRoutes },
  { path: '/envios', nest: true, component: EnviosRoutes },
  { path: '/viajes', nest: true, component: ViajesRoutes },
  { path: '/usuarios', nest: true, component: UsuariosRoutes },
  // Sucursales/Empresa: endpoints SUPERUSER-only (CONTRACTS.md §3).
  { path: '/sucursales', nest: true, component: SucursalesRoutes, roles: [ROLE_SUPERUSER] },
  { path: '/vehiculos', nest: true, component: VehiculosRoutes },
  // Catálogo de Marca/Modelo (SHG-FE-059, ENDPOINTS.md §11/§12): CRUD
  // completo SU/AD — no restringido a SUPERUSER como Sucursales. Tipo de
  // Vehículo queda fuera (backend sólo GET).
  { path: '/catalogo-vehiculos', nest: true, component: CatalogoVehiculosRoutes },
  { path: '/mantenimientos', nest: true, component: MantenimientosRoutes },
];

const isKnownProtectedPath = (pathname) =>
  PROTECTED_SECTIONS.some(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
  );

const ProtectedRoutes = () => {
  const isAuthenticated = useIsAuthenticated();
  const { user } = useAuth();
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    // SHG-FE-061: antes esto forzaba 'auto' incondicionalmente en cada mount
    // de una ruta autenticada, pisando cualquier elección manual de "Modo
    // claro"/"Modo oscuro" que el usuario hubiera hecho segundos antes (el
    // toggle "funcionaba" al tocarlo pero no sobrevivía a la siguiente
    // navegación). Ahora sólo resetea a 'auto' cuando no hay una preferencia
    // explícita ya persistida por Mantine.
    if (isAuthenticated && !hasExplicitColorSchemePreference()) {
      setColorScheme('auto');
    }
  }, [isAuthenticated]);

  // Acceso directo (link compartido) a una ruta protegida sin sesión: manda a
  // `/login` preservando el destino en `?redirect=` (SHG-FE-054) en vez de
  // perderlo — ver `@utils/redirect`. `ProtectedRoutes` es a donde delega
  // `RootRoute` (`/`) y `CatchAllRoute` (cualquier otra ruta reconocida como
  // protegida, SHG-FE-100) — la guarda interna de `ProtectedRoute` (por rol)
  // sólo se monta ya autenticado.
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
          {PROTECTED_SECTIONS.map(
            ({ path, nest, component: SectionComponent, roles = ROLES_WEB }) => (
              <Route key={path} path={path} nest={nest}>
                <ProtectedRoute roles={roles}>
                  <SectionComponent />
                </ProtectedRoute>
              </Route>
            ),
          )}
          {/* SHG-FE-100: catch-all sin `path` — cualquier ruta autenticada que
              no matcheó nada arriba (ej. la vieja `/opciones`, o un typo)
              muestra la 404 dentro del layout de gestión en vez de quedar en
              blanco. Debe ir última: Wouter renderiza la primera que matchea. */}
          <Route>
            <NotFoundPage />
          </Route>
        </Switch>
      </Suspense>
    </Layout>
  );
};

/**
 * Fallback final de `AppRoutes` (sin `path`, matchea cualquier ruta no
 * reconocida arriba). SHG-FE-100: sin sesión, sólo delega en `ProtectedRoutes`
 * (que redirige a `/login?redirect=`, SHG-FE-054) cuando la ruta es una
 * protegida real; si es desconocida, muestra la 404 pública directamente —
 * sin eso, cualquier typo deslogueado terminaba en el login en vez de un 404.
 * Con sesión, siempre delega en `ProtectedRoutes` (su propio Switch ya
 * resuelve rutas desconocidas con la 404 de arriba).
 */
const CatchAllRoute = () => {
  const isAuthenticated = useIsAuthenticated();
  const [location] = useLocation();

  if (!isAuthenticated && !isKnownProtectedPath(location)) {
    return <NotFoundPage />;
  }

  return <ProtectedRoutes />;
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
          `<Route component={CatchAllRoute} />` para poder mostrar la landing
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
      <Route component={CatchAllRoute} />
    </Switch>
  );
};

export default AppRoutes;
