import { lazy, Suspense, useEffect } from 'react';
import { Switch, Route, Redirect } from 'wouter';

import LoginPage from '@features/login';

import Layout from '../layout';
import ProtectedRoute from '@components/ProtectedRoute';
import MobileOnlyScreen from '@components/MobileOnlyScreen';
import { useAuth, useIsAuthenticated } from '@contexts/auth';
import { hasAnyRole, ROLE_SUPERUSER, ROLES_WEB } from '@domain/roles';
import { Center, Loader, useMantineColorScheme } from '@mantine/core';

const HomePage = lazy(() => import('@features/home'));
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
      <Route component={ProtectedRoutes} />
    </Switch>
  );
};

export default AppRoutes;
