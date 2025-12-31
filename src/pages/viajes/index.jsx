import { Route, Switch } from "wouter";

import CrearViaje from "./CrearViaje";
import ListaViajes from "./ListaViajes";
import DetalleViaje from "./DetalleViaje";
import { Stack } from "@mantine/core";

const ViajesRoutes = () => (
  <Switch>
    <Route path="/" component={ListaViajes} />
    <Route path="/crear" component={CrearViaje} />
    <Route path="/:id" component={DetalleViaje} />
  </Switch>
);

export default ViajesRoutes;
