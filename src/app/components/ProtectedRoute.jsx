import { Redirect } from 'wouter';

import { useAuth } from '@contexts/auth';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  return user ? children : <Redirect to="/login" replace />;
};

export default ProtectedRoute;
