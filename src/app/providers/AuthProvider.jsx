import { useState, useMemo, useCallback } from 'react';

import { AuthContext } from '@contexts/auth';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
};

export default AuthProvider;
