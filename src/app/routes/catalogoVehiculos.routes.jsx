import { Redirect, Route, Switch } from 'wouter';

import {
  ListaMarcas,
  CrearMarca,
  EditarMarca,
  ListaModelos,
  CrearModelo,
  EditarModelo,
} from '@features/catalogoVehiculos';

/**
 * Catálogo de Marca/Modelo de vehículo (`SHG-FE-059`, `ENDPOINTS.md`
 * §11/§12). `/` redirige al listado de Marcas — el `Tabs` de
 * `CatalogoVehiculosHeader` alterna entre `/marcas` y `/modelos`.
 *
 * Tipo de Vehículo queda FUERA de alcance: el backend sólo expone GET
 * (`/api/tipoVehiculo`), sin `POST`/`PUT`/`DELETE` — su ABM necesita una
 * tarea de backend nueva antes de poder implementarse acá.
 */
const CatalogoVehiculosRoutes = () => (
  <Switch>
    <Route path="/">
      <Redirect to="/marcas" />
    </Route>
    <Route path="/marcas" component={ListaMarcas} />
    <Route path="/marcas/crear" component={CrearMarca} />
    <Route path="/marcas/:id/editar" component={EditarMarca} />
    <Route path="/modelos" component={ListaModelos} />
    <Route path="/modelos/crear" component={CrearModelo} />
    <Route path="/modelos/:id/editar" component={EditarModelo} />
  </Switch>
);

export default CatalogoVehiculosRoutes;
