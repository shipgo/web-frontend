import { Switch, Route } from "wouter";

import HomePage from "@features/home";
import MapaPage from "@features/mapa";
import LoginPage from "@features/login";

import Layout from "../layout";

import EnviosRoutes from "./envios.routes";
import ViajesRoutes from "./viajes.routes";

const AppRoutes = () => {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/mapa" component={MapaPage} />
            <Route path="/envios" component={EnviosRoutes} nest />
            <Route path="/viajes" component={ViajesRoutes} nest />
            <Route path="/usuarios" component={() => "Usuarios"} nest />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
};

export default AppRoutes;
