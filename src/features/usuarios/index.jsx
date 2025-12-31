import { Route, Switch } from "wouter";

import ListaUsuarios from "./ListaUsuarios";

const UsuariosRoutes = () => (
  <Switch>
    <Route path="/" component={ListaUsuarios} />
    <Route path="/crear" component={"CrearUsuario"} />
    <Route path="/:id" component={"DetalleUsuario"} />
  </Switch>
);

export default UsuariosRoutes;
