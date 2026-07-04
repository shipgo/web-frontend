import { useEffect } from 'react';
import { Switch, Route, Redirect } from 'wouter';

import HomePage from '@features/home';
import MapaPage from '@features/mapa';
import LoginPage from '@features/login';

import Layout from '../layout';
import { useIsAuthenticated } from '@contexts/auth';
import { useMantineColorScheme } from '@mantine/core';

import DashboardRoutes from './dashboard.routes';
import EnviosRoutes from './envios.routes';
import ViajesRoutes from './viajes.routes';
import UsuariosRoutes from './usuarios.routes';
import SucursalesRoutes from './sucursales.routes';
import VehiculosRoutes from './vehiculos.routes';

const ProtectedRoutes = () => {
  const isAuthenticated = useIsAuthenticated();
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (isAuthenticated) setColorScheme('auto');
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Redirect to='/login' />;

  return (
    <Layout>
      <Switch>
        <Route path='/' component={HomePage} />
        <Route path='/dashboard' component={DashboardRoutes} nest />
        <Route path='/mapa' component={MapaPage} />
        <Route path='/envios' component={EnviosRoutes} nest />
        <Route path='/viajes' component={ViajesRoutes} nest />
        <Route path='/usuarios' component={UsuariosRoutes} nest />
        <Route path='/sucursales' component={SucursalesRoutes} nest />
        <Route path='/vehiculos' component={VehiculosRoutes} nest />
      </Switch>
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
