import { Route, Switch } from "wouter";

import { ListaEnvios, CrearEnvios, EditarEnvio, DetalleEnvio } from "@features/envios";

const EnviosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaEnvios} />
    <Route path="/crear" component={CrearEnvios} />
    <Route path="/editar/:id" component={EditarEnvio} />
    <Route path="/:id" component={DetalleEnvio} />
  </Switch>
);

export default EnviosRoutes;
