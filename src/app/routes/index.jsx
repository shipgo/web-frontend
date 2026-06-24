import { Switch, Route } from "wouter";

import HomePage from "@features/home";
import MapaPage from "@features/mapa";
import LoginPage from "@features/login";

import Layout from "../layout";

import DashboardRoutes from "./dashboard.routes";
import EnviosRoutes from "./envios.routes";
import ViajesRoutes from "./viajes.routes";
import UsuariosRoutes from "./usuarios.routes";
import SucursalesRoutes from "./sucursales.routes";
import VehiculosRoutes from "./vehiculos.routes";

const AppRoutes = () => {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/dashboard" component={DashboardRoutes} nest />
            <Route path="/mapa" component={MapaPage} />
            <Route path="/envios" component={EnviosRoutes} nest />
            <Route path="/viajes" component={ViajesRoutes} nest />
            <Route path="/usuarios" component={UsuariosRoutes} nest />
            <Route path="/sucursales" component={SucursalesRoutes} nest />
            <Route path="/vehiculos" component={VehiculosRoutes} nest />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
};

export default AppRoutes;
