import { lazy, Suspense, useEffect } from 'react';
import { Switch, Route, Redirect } from 'wouter';

import LoginPage from '@features/login';

import Layout from '../layout';
import { useIsAuthenticated } from '@contexts/auth';
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
  <Center h="60vh">
    <Loader size="lg" />
  </Center>
);

const ProtectedRoutes = () => {
  const isAuthenticated = useIsAuthenticated();
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (isAuthenticated) setColorScheme('auto');
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Redirect to='/login' />;

  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path='/' component={HomePage} />
          <Route path='/dashboard' component={DashboardRoutes} nest />
          <Route path='/mapa' component={MapaPage} />
          <Route path='/envios' component={EnviosRoutes} nest />
          <Route path='/viajes' component={ViajesRoutes} nest />
          <Route path='/usuarios' component={UsuariosRoutes} nest />
          <Route path='/sucursales' component={SucursalesRoutes} nest />
          <Route path='/vehiculos' component={VehiculosRoutes} nest />
          <Route path='/mantenimientos' component={MantenimientosRoutes} nest />
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
