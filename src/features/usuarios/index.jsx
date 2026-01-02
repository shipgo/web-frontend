import { Route, Switch } from "wouter";

import ListaUsuarios from "./ListaUsuarios";
import CrearUsuario from "./CrearUsuario";
import EditarUsuario from "./EditarUsuario";
import DetalleUsuario from "./DetalleUsuario";

const UsuariosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaUsuarios} />
    <Route path="/crear" component={CrearUsuario} />
    <Route path="/:id/editar" component={EditarUsuario} />
    <Route path="/:id" component={DetalleUsuario} />
  </Switch>
);

export default UsuariosRoutes;
