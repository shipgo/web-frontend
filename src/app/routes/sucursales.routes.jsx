import { Route, Switch } from 'wouter';

import { ListaSucursales } from '@features/sucursales';

const SucursalesRoutes = () => (
  <Switch>
    <Route path="/" component={ListaSucursales} />
  </Switch>
);

export default SucursalesRoutes;
