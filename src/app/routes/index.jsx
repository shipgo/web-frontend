import { Switch, Route } from "wouter";

import Layout from "../layout";
import LoginPage from "@features/login";
import UsuariosRoutes from "@features/usuarios";
import VehiculosRoutes from "@features/vehiculos";
import SucursalesRoutes from "@features/sucursales";
import MantenimientosRoutes from "@features/mantenimientos";

import EnviosRoutes from "./envios.routes";
import ViajesRoutes from "./viajes.routes";

const AppRoutes = () => {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={() => "Home"} />
            <Route path="/mapa" component={() => "Mapa"} />
            <Route path="/envios" component={EnviosRoutes} nest />
            <Route path="/viajes" component={ViajesRoutes} nest />
            <Route path="/usuarios" component={UsuariosRoutes} nest />
            <Route path="/vehiculos" component={VehiculosRoutes} nest />
            <Route path="/sucursales" component={SucursalesRoutes} nest />
            <Route
              path="/mantenimientos"
              component={MantenimientosRoutes}
              nest
            />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
};

export default AppRoutes;
