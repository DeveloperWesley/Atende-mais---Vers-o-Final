import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const mockUser = {
  id: 1,
  nome: 'Dr. João Silva',
  email: 'joao@atendeplus.com.br',
  perfil: 'profissional'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(mockUser);

  async function login(credentials) {
    // TODO: integrar com API real
    // TODO: implementar autenticação JWT
    setUser({
      ...mockUser,
      email: credentials.email || mockUser.email
    });
    return mockUser;
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user)
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
