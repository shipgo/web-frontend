import { Route, Switch } from "wouter";

import { ListaEnvios, CrearEnvios } from "@features/envios";

const EnviosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaEnvios} />
    <Route path="/crear" component={CrearEnvios} />
    <Route path="/editar/:id" component={() => "Edit"} />
    <Route path="/:id" component={() => "Detail"} />
  </Switch>
);

export default EnviosRoutes;
