import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NovoAtendimento from './pages/NovoAtendimento.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/novo-atendimento" element={<NovoAtendimento />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
