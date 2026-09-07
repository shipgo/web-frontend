import { Route, Switch, Redirect } from 'wouter';

import {
  PORTAL_BASE_PATH,
  PORTAL_HOME_PATH,
} from '@domain/roles';

import {
  PortalEnviosPage,
  PortalEnvioDetallePage,
} from '@features/portal';

/**
 * Rutas del portal CUSTOMER (`/portal/**`, SHG-FE-026). Montado con `nest` desde
 * `routes/index.jsx` bajo `PORTAL_BASE_PATH`, detrás de `PortalRoute` (guarda de
 * rol) + `PortalLayout`.
 *
 * Los `path` de acá son **relativos** al base del nest (`/portal`); se derivan de
 * `PORTAL_HOME_PATH` para no divergir si cambia el home del portal.
 */
const ENVIOS_PATH = PORTAL_HOME_PATH.slice(PORTAL_BASE_PATH.length); // '/envios'

const PortalRoutes = () => (
  <Switch>
    <Route path={ENVIOS_PATH} component={PortalEnviosPage} />
    <Route path={`${ENVIOS_PATH}/:codigo`} component={PortalEnvioDetallePage} />
    <Route>
      {/* `~` = ruta absoluta desde la raíz (ignora el base del nest). */}
      <Redirect to={`~${PORTAL_HOME_PATH}`} replace />
    </Route>
  </Switch>
);

export default PortalRoutes;
