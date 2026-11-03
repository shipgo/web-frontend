import { Route, Switch } from 'wouter';

import {
  ListaSucursales,
  CrearSucursal,
  DetalleSucursal,
  EditarSucursal,
} from '@features/sucursales';

const SucursalesRoutes = () => (
  <Switch>
    <Route path="/" component={ListaSucursales} />
    <Route path="/crear" component={CrearSucursal} />
    <Route path="/:id" component={DetalleSucursal} />
    <Route path="/:id/editar" component={EditarSucursal} />
  </Switch>
);

export default SucursalesRoutes;
