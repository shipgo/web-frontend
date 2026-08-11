import { Switch, Route } from 'wouter';
import { DashboardPage } from '@features/dashboard';

const DashboardRoutes = () => (
  <Switch>
    <Route path="/" component={DashboardPage} />
  </Switch>
);

export default DashboardRoutes;
