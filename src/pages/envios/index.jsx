import { Route, Switch } from "wouter";

import ListaEnvios from "./ListaEnvios";
import EnviosCreate from "./CrearEnvios";

const EnviosRoute = () => (
  <Switch>
    <Route path="/" component={ListaEnvios} />
    <Route path="/crear" component={EnviosCreate} />
    <Route path="/editar/:id" component={"Edit"} />
    <Route path="/:id" component={"Detail"} />
  </Switch>
)

export default EnviosRoute;
