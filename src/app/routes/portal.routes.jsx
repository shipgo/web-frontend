import { Route, Switch, Redirect } from 'wouter';

import {
  PortalEnviosPage,
  PortalEnvioDetallePage,
} from '@features/portal';

/**
 * Rutas del portal CUSTOMER (`/portal/**`, SHG-FE-026). Montado con `nest` desde
 * `routes/index.jsx`, detrás de `PortalRoute` (guarda de rol) + `PortalLayout`.
 */
const PortalRoutes = () => (
  <Switch>
    <Route path="/envios" component={PortalEnviosPage} />
    <Route path="/envios/:codigo" component={PortalEnvioDetallePage} />
    <Route>
      <Redirect to="/envios" replace />
    </Route>
  </Switch>
);

export default PortalRoutes;
