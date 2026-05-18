import { Navigate, Route, Routes } from 'react-router-dom';
import ImpersonationBanner from './components/ImpersonationBanner.jsx';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Atendimentos from './pages/Atendimentos.jsx';
import Despesas from './pages/Despesas.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Relatorios from './pages/Relatorios.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminConfiguracoes from './pages/AdminConfiguracoes.jsx';
import { SidebarProvider } from './contexts/SidebarContext.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

/* Rota protegida — admin puro vai para /admin, não para /dashboard */
function DashboardRoute() {
  const { user, impersonating } = useAuth();
  if (user?.perfil === 'admin' && !impersonating) {
    return <Navigate to="/admin" replace />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <ImpersonationBanner />
        <Routes>
          <Route path="/"               element={<Navigate to="/login" replace />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/cadastro"       element={<Cadastro />} />
          <Route path="/dashboard"      element={<DashboardRoute />} />
          <Route path="/atendimentos"   element={<Atendimentos />} />
          <Route path="/despesas"       element={<Despesas />} />
          <Route path="/pacientes"      element={<Pacientes />} />
          <Route path="/relatorios"     element={<Relatorios />} />
          <Route path="/configuracoes"  element={<Configuracoes />} />
          <Route path="/admin"              element={<AdminDashboard />} />
          <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
        </Routes>
      </SidebarProvider>
    </SettingsProvider>
  );
}
