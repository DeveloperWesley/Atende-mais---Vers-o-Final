import { Plus } from 'lucide-react';
import Button from './Button.jsx';

export default function Header({ onNovoAtendimento }) {
  return (
    <header className="dashboard-header">
      <div>
        <h1>Olá, Dr. João Silva! 👋</h1>
        <p>Aqui está o resumo dos seus atendimentos.</p>
      </div>
      <Button icon={Plus} onClick={onNovoAtendimento}>
        Novo Atendimento
      </Button>
    </header>
  );
}
