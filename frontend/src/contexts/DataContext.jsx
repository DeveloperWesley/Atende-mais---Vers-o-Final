import { createContext, useContext, useState } from 'react';

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const mockAtendimentos = [
  { id: 1,  data: '16/05/2024', hora: '10:30', paciente: 'Maria Oliveira',   pagador: 'Maria Oliveira',   cpfPaciente: '12345678901', cpfPagador: '12345678901',    valorNum: 250,    valor: fmt(250),    situacao: 'pendente',  recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'pronto' },
  { id: 2,  data: '15/05/2024', hora: '14:00', paciente: 'João Souza',        pagador: 'João Souza',        cpfPaciente: '98765432100', cpfPagador: '98765432100',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 3,  data: '14/05/2024', hora: '09:00', paciente: 'Ana Paula Lima',    pagador: 'Plano Saúde ABC',  cpfPaciente: '11122233344', cpfPagador: '12345678000190', valorNum: 300,    valor: fmt(300),    situacao: 'pendente',  recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'pronto' },
  { id: 4,  data: '13/05/2024', hora: '16:30', paciente: 'Carlos Eduardo',    pagador: 'Carlos Eduardo',    cpfPaciente: '44455566677', cpfPagador: '44455566677',    valorNum: 150,    valor: fmt(150),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'nao'   },
  { id: 5,  data: '10/05/2024', hora: '11:00', paciente: 'Juliana Martins',   pagador: 'Juliana Martins',   cpfPaciente: '88899900011', cpfPagador: '88899900011',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 6,  data: '09/05/2024', hora: '08:30', paciente: 'Roberto Alves',     pagador: 'Roberto Alves',     cpfPaciente: '33344455566', cpfPagador: '33344455566',    valorNum: 220,    valor: fmt(220),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 7,  data: '08/05/2024', hora: '15:00', paciente: 'Fernanda Costa',    pagador: 'Fernanda Costa',    cpfPaciente: '55566677788', cpfPagador: '55566677788',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 8,  data: '07/05/2024', hora: '10:00', paciente: 'Lucas Mendes',      pagador: 'Convênio Saúde+',  cpfPaciente: '77788899900', cpfPagador: '98765432000181', valorNum: 350,    valor: fmt(350),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 9,  data: '06/05/2024', hora: '09:30', paciente: 'Patricia Lima',     pagador: 'Patricia Lima',     cpfPaciente: '11223344556', cpfPagador: '11223344556',    valorNum: 250,    valor: fmt(250),    situacao: 'cancelado', recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'nao'   },
  { id: 10, data: '05/05/2024', hora: '13:00', paciente: 'Thiago Souza',      pagador: 'Thiago Souza',      cpfPaciente: '99887766554', cpfPagador: '99887766554',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 11, data: '04/05/2024', hora: '14:30', paciente: 'Camila Rocha',      pagador: 'Camila Rocha',      cpfPaciente: '66554433221', cpfPagador: '66554433221',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 12, data: '03/05/2024', hora: '11:30', paciente: 'Diego Ferreira',    pagador: 'Diego Ferreira',    cpfPaciente: '44332211009', cpfPagador: '44332211009',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 13, data: '02/05/2024', hora: '08:00', paciente: 'Amanda Santos',     pagador: 'Amanda Santos',     cpfPaciente: '22110099887', cpfPagador: '22110099887',    valorNum: 300,    valor: fmt(300),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 14, data: '01/05/2024', hora: '16:00', paciente: 'Bruno Oliveira',    pagador: 'Bruno Oliveira',    cpfPaciente: '88776655443', cpfPagador: '88776655443',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 15, data: '30/04/2024', hora: '10:00', paciente: 'Larissa Pereira',   pagador: 'Larissa Pereira',   cpfPaciente: '55443322110', cpfPagador: '55443322110',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 16, data: '29/04/2024', hora: '15:30', paciente: 'Marcos Vieira',     pagador: 'Plano Saúde ABC',  cpfPaciente: '33221100998', cpfPagador: '12345678000190', valorNum: 350,    valor: fmt(350),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 17, data: '28/04/2024', hora: '09:00', paciente: 'Isabela Gomes',     pagador: 'Isabela Gomes',     cpfPaciente: '11009988776', cpfPagador: '11009988776',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 18, data: '27/04/2024', hora: '14:00', paciente: 'Rafael Nascimento', pagador: 'Rafael Nascimento', cpfPaciente: '99008877665', cpfPagador: '99008877665',    valorNum: 180,    valor: fmt(180),    situacao: 'cancelado', recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'nao'   },
  { id: 19, data: '26/04/2024', hora: '11:00', paciente: 'Vanessa Ribeiro',   pagador: 'Vanessa Ribeiro',   cpfPaciente: '77665544332', cpfPagador: '77665544332',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 20, data: '25/04/2024', hora: '08:30', paciente: 'Eduardo Silva',     pagador: 'Eduardo Silva',     cpfPaciente: '55443322119', cpfPagador: '55443322119',    valorNum: 300,    valor: fmt(300),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 21, data: '24/04/2024', hora: '16:00', paciente: 'Natalia Castro',    pagador: 'Natalia Castro',    cpfPaciente: '33221100881', cpfPagador: '33221100881',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 22, data: '23/04/2024', hora: '10:30', paciente: 'Henrique Lima',     pagador: 'Henrique Lima',     cpfPaciente: '11220099887', cpfPagador: '11220099887',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 23, data: '22/04/2024', hora: '13:30', paciente: 'Beatriz Alves',     pagador: 'Beatriz Alves',     cpfPaciente: '99887766441', cpfPagador: '99887766441',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
  { id: 24, data: '21/04/2024', hora: '09:00', paciente: 'Gustavo Martins',   pagador: 'Gustavo Martins',   cpfPaciente: '77665522110', cpfPagador: '77665522110',    valorNum: 220,    valor: fmt(220),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto' },
];

const mockDespesas = [
  { id: 1,  data: '16/05/2024', descricao: 'Aluguel sala comercial',  categoria: 'Aluguel',    valorNum: 1200,  valor: fmt(1200),  formaPagamento: 'Pix',     comprovante: true  },
  { id: 2,  data: '15/05/2024', descricao: 'Internet',                categoria: 'Serviços',   valorNum: 120,   valor: fmt(120),   formaPagamento: 'Débito',  comprovante: true  },
  { id: 3,  data: '14/05/2024', descricao: 'Material de escritório',  categoria: 'Materiais',  valorNum: 85.5,  valor: fmt(85.5),  formaPagamento: 'Crédito', comprovante: false },
  { id: 4,  data: '13/05/2024', descricao: 'Software / Sistema',      categoria: 'Serviços',   valorNum: 89.9,  valor: fmt(89.9),  formaPagamento: 'Pix',     comprovante: false },
  { id: 5,  data: '10/05/2024', descricao: 'Combustível',             categoria: 'Transporte', valorNum: 75,    valor: fmt(75),    formaPagamento: 'Débito',  comprovante: false },
  { id: 6,  data: '08/05/2024', descricao: 'Telefone',                categoria: 'Serviços',   valorNum: 89.9,  valor: fmt(89.9),  formaPagamento: 'Débito',  comprovante: true  },
  { id: 7,  data: '07/05/2024', descricao: 'Energia elétrica',        categoria: 'Utilidades', valorNum: 180,   valor: fmt(180),   formaPagamento: 'Débito',  comprovante: true  },
  { id: 8,  data: '05/05/2024', descricao: 'Água',                    categoria: 'Utilidades', valorNum: 45,    valor: fmt(45),    formaPagamento: 'Débito',  comprovante: true  },
  { id: 9,  data: '04/05/2024', descricao: 'Equipamentos médicos',    categoria: 'Materiais',  valorNum: 320,   valor: fmt(320),   formaPagamento: 'Crédito', comprovante: true  },
  { id: 10, data: '03/05/2024', descricao: 'Limpeza e higiene',       categoria: 'Materiais',  valorNum: 95,    valor: fmt(95),    formaPagamento: 'Pix',     comprovante: false },
  { id: 11, data: '02/05/2024', descricao: 'Estacionamento',          categoria: 'Transporte', valorNum: 120,   valor: fmt(120),   formaPagamento: 'Dinheiro',comprovante: false },
  { id: 12, data: '30/04/2024', descricao: 'Conta bancária',          categoria: 'Bancário',   valorNum: 35,    valor: fmt(35),    formaPagamento: 'Débito',  comprovante: true  },
  { id: 13, data: '29/04/2024', descricao: 'Propaganda / Marketing',  categoria: 'Marketing',  valorNum: 250,   valor: fmt(250),   formaPagamento: 'Pix',     comprovante: true  },
  { id: 14, data: '28/04/2024', descricao: 'Impressão e papel',       categoria: 'Materiais',  valorNum: 68,    valor: fmt(68),    formaPagamento: 'Dinheiro',comprovante: false },
  { id: 15, data: '27/04/2024', descricao: 'Assinatura revista',      categoria: 'Serviços',   valorNum: 49.9,  valor: fmt(49.9),  formaPagamento: 'Crédito', comprovante: false },
  { id: 16, data: '25/04/2024', descricao: 'Manutenção equipamentos', categoria: 'Materiais',  valorNum: 180,   valor: fmt(180),   formaPagamento: 'Pix',     comprovante: true  },
  { id: 17, data: '23/04/2024', descricao: 'Curso / Capacitação',     categoria: 'Educação',   valorNum: 350,   valor: fmt(350),   formaPagamento: 'Crédito', comprovante: true  },
  { id: 18, data: '21/04/2024', descricao: 'Alimentação',             categoria: 'Outros',     valorNum: 76.8,  valor: fmt(76.8),  formaPagamento: 'Dinheiro',comprovante: false },
];

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [atendimentos, setAtendimentos] = useState(mockAtendimentos);
  const [despesas, setDespesas]         = useState(mockDespesas);

  /* ── Atendimentos ── */
  function addAtendimento(item) {
    setAtendimentos((prev) => [{ ...item, id: Date.now() }, ...prev]);
  }
  function updateAtendimento(id, item) {
    setAtendimentos((prev) => prev.map((a) => (a.id === id ? { ...a, ...item } : a)));
  }
  function deleteAtendimento(id) {
    setAtendimentos((prev) => prev.filter((a) => a.id !== id));
  }

  /* ── Despesas ── */
  function addDespesa(item) {
    setDespesas((prev) => [{ ...item, id: Date.now() }, ...prev]);
  }
  function updateDespesa(id, item) {
    setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, ...item } : d)));
  }
  function deleteDespesa(id) {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <DataContext.Provider value={{
      atendimentos, addAtendimento, updateAtendimento, deleteAtendimento,
      despesas,     addDespesa,     updateDespesa,     deleteDespesa,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
