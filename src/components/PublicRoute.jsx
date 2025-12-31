import { Redirect } from 'wouter';

import { useAuth } from '@contexts/auth';

const PublicRoute = ({ children, redirect = "/" }) => {
  const { user } = useAuth();

  return user ? <Redirect to={redirect} replace /> : children;
};

export default PublicRoute;
