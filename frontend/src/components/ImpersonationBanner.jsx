import { ArrowLeft, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ImpersonationBanner() {
  const { impersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!impersonating) return null;

  function handleBack() {
    stopImpersonation();
    navigate('/admin');
  }

  return (
    <div className="impersonation-banner">
      <div className="impersonation-banner-inner">
        <Eye size={16} />
        <span>Visualizando perfil de: <strong>{impersonating.nome}</strong> — {impersonating.especialidade}</span>
      </div>
      <button className="impersonation-back-btn" onClick={handleBack}>
        <ArrowLeft size={15} /> Voltar para Administração
      </button>
    </div>
  );
}
