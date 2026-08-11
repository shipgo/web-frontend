import { Route, Switch } from 'wouter';

import { ListaUsuarios } from '@features/usuarios';
import CrearUsuario from '@features/usuarios/CrearUsuario';
import EditarUsuario from '@features/usuarios/EditarUsuario';
import DetalleUsuario from '@features/usuarios/DetalleUsuario';

const UsuariosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaUsuarios} />
    <Route path="/crear" component={CrearUsuario} />
    <Route path="/:id/editar" component={EditarUsuario} />
    <Route path="/:id" component={DetalleUsuario} />
  </Switch>
);

export default UsuariosRoutes;
