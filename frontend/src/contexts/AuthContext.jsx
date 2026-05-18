import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const mockUsuariosInicial = [
  {
    id: 1, nome: 'Administrador', email: 'admin@atende.com', senha: 'admin123',
    perfil: 'admin', especialidade: 'Administrador', status: 'ativo', plano: 'Admin',
    ultimoAcesso: 'Hoje, 09:00', totalAtendimentos: 0, totalFaturamento: fmt(0),
    criadoEm: '2024-01-01',
  },
  {
    id: 2, nome: 'João Silva', email: 'joao@atende.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Psicologia', status: 'ativo', plano: 'Premium',
    ultimoAcesso: 'Hoje, 08:30', totalAtendimentos: 24, totalFaturamento: fmt(5570),
    criadoEm: '2024-02-10',
  },
  {
    id: 3, nome: 'Camila Rocha', email: 'camila@atende.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Nutrição', status: 'ativo', plano: 'Básico',
    ultimoAcesso: 'Ontem, 16:21', totalAtendimentos: 86, totalFaturamento: fmt(8430),
    criadoEm: '2024-03-05',
  },
  {
    id: 4, nome: 'Rafael Martins', email: 'rafael@atende.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Fisioterapia', status: 'pendente', plano: 'Premium',
    ultimoAcesso: '—', totalAtendimentos: 0, totalFaturamento: fmt(0),
    criadoEm: '2024-05-20',
  },
  {
    id: 5, nome: 'Maria Oliveira', email: 'maria.oliveira@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Psicologia', status: 'ativo', plano: 'Premium',
    ultimoAcesso: 'Hoje, 08:42', totalAtendimentos: 128, totalFaturamento: fmt(18560),
    criadoEm: '2024-01-15',
  },
  {
    id: 6, nome: 'João Souza', email: 'joao.souza@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Nutrição', status: 'pendente', plano: 'Premium',
    ultimoAcesso: '—', totalAtendimentos: 0, totalFaturamento: fmt(0),
    criadoEm: '2024-05-17',
  },
  {
    id: 7, nome: 'Ana Paula Lima', email: 'ana.lima@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Fisioterapia', status: 'ativo', plano: 'Básico',
    ultimoAcesso: 'Ontem, 16:21', totalAtendimentos: 86, totalFaturamento: fmt(8430),
    criadoEm: '2024-02-01',
  },
  {
    id: 8, nome: 'Carlos Eduardo', email: 'carlos.eduardo@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Medicina', status: 'ativo', plano: 'Premium',
    ultimoAcesso: 'Hoje, 07:15', totalAtendimentos: 210, totalFaturamento: fmt(32750),
    criadoEm: '2023-11-10',
  },
  {
    id: 9, nome: 'Tânia Rocha', email: 'tania.rocha@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Fonoaudiologia', status: 'inativo', plano: 'Básico',
    ultimoAcesso: '—', totalAtendimentos: 15, totalFaturamento: fmt(1250),
    criadoEm: '2024-01-20',
  },
  {
    id: 10, nome: 'Rafael Ferreira', email: 'rafael.ferreira@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Odontologia', status: 'pendente', plano: 'Premium',
    ultimoAcesso: '—', totalAtendimentos: 0, totalFaturamento: fmt(0),
    criadoEm: '2024-05-18',
  },
  {
    id: 11, nome: 'Larissa Barbosa', email: 'larissa.barbosa@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Terapia Ocupacional', status: 'ativo', plano: 'Básico',
    ultimoAcesso: 'Ontem, 11:09', totalAtendimentos: 42, totalFaturamento: fmt(4980),
    criadoEm: '2024-03-12',
  },
  {
    id: 12, nome: 'Bruno Alves', email: 'bruno.alves@exemplo.com', senha: 'senha123',
    perfil: 'profissional', especialidade: 'Enfermagem', status: 'ativo', plano: 'Básico',
    ultimoAcesso: 'Hoje, 06:50', totalAtendimentos: 67, totalFaturamento: fmt(6200),
    criadoEm: '2024-02-28',
  },
];

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [usuarios,      setUsuarios]      = useState(mockUsuariosInicial);
  const [impersonating, setImpersonating] = useState(null);

  async function login({ email, senha }) {
    const found = usuarios.find(u => u.email === email && u.senha === senha);
    if (!found)                       throw new Error('E-mail ou senha incorretos.');
    if (found.status === 'pendente')  throw new Error('Sua conta está aguardando aprovação do administrador.');
    if (found.status === 'inativo')   throw new Error('Sua conta foi desativada. Entre em contato com o administrador.');
    const { senha: _, ...userSemSenha } = found;
    setUser(userSemSenha);
    return userSemSenha;
  }

  async function registrar({ nome, email, senha, especialidade }) {
    if (usuarios.some(u => u.email === email)) throw new Error('Já existe uma conta com este e-mail.');
    const novo = {
      id: Date.now(), nome, email, senha,
      perfil: 'profissional', especialidade,
      status: 'pendente', plano: 'Básico',
      ultimoAcesso: '—', totalAtendimentos: 0, totalFaturamento: fmt(0),
      criadoEm: new Date().toISOString().slice(0, 10),
    };
    setUsuarios(prev => [...prev, novo]);
  }

  /* ── Ações administrativas ── */
  const aprovarUsuario    = useCallback((id) => setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: 'ativo' }    : u)), []);
  const rejeitarUsuario   = useCallback((id) => setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: 'inativo' }  : u)), []);
  const desativarUsuario  = useCallback((id) => setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: 'inativo' }  : u)), []);
  const reativarUsuario   = useCallback((id) => setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: 'ativo' }    : u)), []);

  /* ── Impersonation ── */
  const startImpersonation = useCallback((profissional) => setImpersonating(profissional), []);
  const stopImpersonation  = useCallback(() => setImpersonating(null), []);

  function logout() { setUser(null); setImpersonating(null); }

  /* Usuário "efetivo" — quando impersonando, age como o profissional */
  const effectiveUser = impersonating || user;

  const value = useMemo(() => ({
    user, usuarios, effectiveUser, impersonating,
    login, logout, registrar,
    aprovarUsuario, rejeitarUsuario, desativarUsuario, reativarUsuario,
    startImpersonation, stopImpersonation,
    isAuthenticated: Boolean(user),
  }), [user, usuarios, impersonating]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return ctx;
}
