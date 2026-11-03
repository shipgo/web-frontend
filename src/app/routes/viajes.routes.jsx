import { Route, Switch } from "wouter";

import {
  ListaViajes,
  CrearViaje,
  DetalleViaje,
  EditarViaje,
} from "@features/viajes";

const ViajesRoutes = () => (
  <Switch>
    <Route path="/" component={ListaViajes} />
    <Route path="/crear" component={CrearViaje} />
    <Route path="/:id/editar" component={EditarViaje} />
    <Route path="/:id" component={DetalleViaje} />
  </Switch>
);

export default ViajesRoutes;
