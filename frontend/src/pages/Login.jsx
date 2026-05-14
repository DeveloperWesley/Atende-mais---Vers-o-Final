import { Eye, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { Brand } from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    senha: ''
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await login(credentials);
    navigate('/dashboard');
  }

  return (
    <main className="login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="wave wave-one" />
      <div className="wave wave-two" />

      <section className="login-content">
        <div className="login-brand">
          <Brand />
          <p>Simples para você. Completo para seu negócio.</p>
        </div>

        <form className="login-card glass-panel" onSubmit={handleSubmit}>
          <div className="card-heading">
            <h1>Acesse sua conta</h1>
            <p>Entre com seu e-mail e senha para continuar</p>
          </div>

          <Input
            label="E-mail"
            type="email"
            icon={Mail}
            placeholder="seu@email.com"
            value={credentials.email}
            onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
          />

          <Input
            label="Senha"
            type="password"
            icon={Lock}
            suffix={<Eye size={17} />}
            placeholder="••••••••"
            value={credentials.senha}
            onChange={(event) => setCredentials((current) => ({ ...current, senha: event.target.value }))}
          />

          <a className="soft-link" href="#recuperar">
            Esqueci minha senha
          </a>

          <Button type="submit" className="login-button">
            Entrar
          </Button>

          <p className="signup-note">
            Ainda não tem uma conta? <a href="#administrador">Fale com o administrador</a>
          </p>
        </form>

        <footer className="login-footer">
          <p>
            <ShieldCheck size={18} />
            Seus dados protegidos com segurança
          </p>
          <small>© 2024 Atende+ • Todos os direitos reservados.</small>
        </footer>
      </section>
    </main>
  );
}
