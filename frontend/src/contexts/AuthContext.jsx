import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// Mock inicial de usuários (simula o banco de dados)
const mockUsuariosInicial = [
  {
    id: 1,
    nome: 'Administrador',
    email: 'admin@atende.com',
    senha: 'admin123',
    perfil: 'admin',
    especialidade: '',
    status: 'ativo',
    criadoEm: '2024-01-01'
  },
  {
    id: 2,
    nome: 'Dr. João Silva',
    email: 'joao@atende.com',
    senha: 'senha123',
    perfil: 'profissional',
    especialidade: 'Psicologia',
    status: 'ativo',
    criadoEm: '2024-02-10'
  },
  {
    id: 3,
    nome: 'Dra. Camila Rocha',
    email: 'camila@atende.com',
    senha: 'senha123',
    perfil: 'profissional',
    especialidade: 'Nutrição',
    status: 'ativo',
    criadoEm: '2024-03-05'
  },
  {
    id: 4,
    nome: 'Dr. Rafael Martins',
    email: 'rafael@atende.com',
    senha: 'senha123',
    perfil: 'profissional',
    especialidade: 'Fisioterapia',
    status: 'pendente',
    criadoEm: '2024-05-20'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState(mockUsuariosInicial);

  async function login({ email, senha }) {
    const encontrado = usuarios.find((u) => u.email === email && u.senha === senha);

    if (!encontrado) {
      throw new Error('E-mail ou senha incorretos.');
    }

    if (encontrado.status === 'pendente') {
      throw new Error('Sua conta está aguardando aprovação do administrador.');
    }

    if (encontrado.status === 'inativo') {
      throw new Error('Sua conta foi desativada. Entre em contato com o administrador.');
    }

    const { senha: _, ...userSemSenha } = encontrado;
    setUser(userSemSenha);
    return userSemSenha;
  }

  async function registrar({ nome, email, senha, especialidade }) {
    const jaExiste = usuarios.some((u) => u.email === email);
    if (jaExiste) {
      throw new Error('Já existe uma conta com este e-mail.');
    }

    const novoUsuario = {
      id: Date.now(),
      nome,
      email,
      senha,
      perfil: 'profissional',
      especialidade,
      status: 'pendente',
      criadoEm: new Date().toISOString().slice(0, 10)
    };

    setUsuarios((lista) => [...lista, novoUsuario]);
  }

  function aprovarUsuario(id) {
    setUsuarios((lista) =>
      lista.map((u) => (u.id === id ? { ...u, status: 'ativo' } : u))
    );
  }

  function rejeitarUsuario(id) {
    setUsuarios((lista) =>
      lista.map((u) => (u.id === id ? { ...u, status: 'inativo' } : u))
    );
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      usuarios,
      login,
      logout,
      registrar,
      aprovarUsuario,
      rejeitarUsuario,
      isAuthenticated: Boolean(user)
    }),
    [user, usuarios]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
