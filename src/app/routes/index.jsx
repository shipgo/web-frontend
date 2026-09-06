import { lazy, Suspense, useEffect } from 'react';
import { Switch, Route, Redirect } from 'wouter';

import LoginPage from '@features/login';

import Layout from '../layout';
import PublicLayout from '../layout/PublicLayout';
import ProtectedRoute from '@components/ProtectedRoute';
import PublicRoute from '@components/PublicRoute';
import MobileOnlyScreen from '@components/MobileOnlyScreen';
import { useAuth, useIsAuthenticated } from '@contexts/auth';
import { hasAnyRole, ROLE_SUPERUSER, ROLES_WEB } from '@domain/roles';
import { Center, Loader, useMantineColorScheme } from '@mantine/core';

const RecuperarCuentaPage = lazy(() => import('@features/login/RecuperarCuenta'));
const RecuperarCuentaTokenPage = lazy(
  () => import('@features/login/RecuperarCuentaToken'),
);
const HomePage = lazy(() => import('@features/home'));
const TrackingPublicoPage = lazy(() =>
  import('@features/tracking').then((m) => ({ default: m.TrackingPublicoPage })),
);
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

  if (!isAuthenticated) return <Redirect to='/login' />;

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

const AppRoutes = () => {
  return (
    <Switch>
      <Route path='/login' component={LoginPage} />
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
      <Route component={ProtectedRoutes} />
    </Switch>
  );
};

export default AppRoutes;
