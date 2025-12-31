import { Route, Switch } from "wouter";

import { ListaViajes, CrearViaje, DetalleViaje } from "@features/viajes";

const ViajesRoutes = () => (
  <Switch>
    <Route path="/" component={ListaViajes} />
    <Route path="/crear" component={CrearViaje} />
    <Route path="/:id" component={DetalleViaje} />
  </Switch>
);

export default ViajesRoutes;
