import { Route, Switch } from "wouter";

import ListaMantenimientos from "./ListaMantenimientos";
import CrearMantenimiento from "./CrearMantenimiento";
import DetalleMantenimiento from "./DetalleMantenimiento";
import EditarMantenimiento from "./EditarMantenimiento";

const MantenimientosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaMantenimientos} />
    <Route path="/crear" component={CrearMantenimiento} />
    <Route path="/:id" component={DetalleMantenimiento} />
    <Route path="/:id/editar" component={EditarMantenimiento} />
  </Switch>
);

export default MantenimientosRoutes;

