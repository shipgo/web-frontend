import { useState, useMemo, useEffect } from "react";

import { AuthContext } from "@contexts/auth";

const DEFAULT_USER = {
  fullname: 'Joaquín Dolcemascolo',
  email: 'joadolce@hotmail.com',
  role: 'Administrador',
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);

  const validateUser = async () => {
    try {
      setIsLoading(true);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { validateUser() }, []);

  const value = useMemo(() => ({ user, isLoading }), [user, isLoading]);

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
};

export default AuthProvider;
