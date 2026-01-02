import { Route, Switch } from "wouter";

import ListaVehiculos from "./ListaVehiculos";
import CrearVehiculo from "./CrearVehiculo";
import EditarVehiculo from "./EditarVehiculo";
import DetalleVehiculo from "./DetalleVehiculo";

const VehiculosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaVehiculos} />
    <Route path="/crear" component={CrearVehiculo} />
    <Route path="/:id/editar" component={EditarVehiculo} />
    <Route path="/:id" component={DetalleVehiculo} />
  </Switch>
);

export default VehiculosRoutes;

