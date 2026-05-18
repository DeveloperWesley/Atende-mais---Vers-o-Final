import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Atendimentos from './pages/Atendimentos.jsx';
import Despesas from './pages/Despesas.jsx';
import Pacientes from './pages/Pacientes.jsx';
import Relatorios from './pages/Relatorios.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { SidebarProvider } from './contexts/SidebarContext.jsx';

export default function App() {
  return (
    <SidebarProvider>
    <Routes>
      <Route path="/"               element={<Navigate to="/login" replace />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/cadastro"       element={<Cadastro />} />
      <Route path="/dashboard"      element={<Dashboard />} />
      <Route path="/atendimentos"   element={<Atendimentos />} />
      <Route path="/despesas"       element={<Despesas />} />
      <Route path="/pacientes"      element={<Pacientes />} />
      <Route path="/relatorios"     element={<Relatorios />} />
      <Route path="/admin"          element={<AdminDashboard />} />
    </Routes>
    </SidebarProvider>
  );
}
