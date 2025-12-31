import { Switch, Route } from "wouter";

import Layout from "../layout";

import EnviosRoutes from "./envios.routes";
import ViajesRoutes from "./viajes.routes";

const AppRoutes = () => {
  return (
    <Switch>
      <Route path="/login" component={() => "Login"} />

      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={() => "Home"} />
            <Route path="/mapa" component={() => "Mapa"} />
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
