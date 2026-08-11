import { Route, Switch } from 'wouter';

import { ListaVehiculos } from '@features/vehiculos';

const VehiculosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaVehiculos} />
  </Switch>
);

export default VehiculosRoutes;
