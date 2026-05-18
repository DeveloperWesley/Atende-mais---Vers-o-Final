import { createContext, useContext, useState } from 'react';

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const mockAtendimentos = [
  { id: 1,  data: '16/05/2024', hora: '10:30', paciente: 'Maria Oliveira',   pagador: 'Maria Oliveira',   cpfPaciente: '12345678901', cpfPagador: '12345678901',    valorNum: 250,    valor: fmt(250),    situacao: 'pendente',  recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'PIX'     },
  { id: 2,  data: '15/05/2024', hora: '14:00', paciente: 'João Souza',        pagador: 'João Souza',        cpfPaciente: '98765432100', cpfPagador: '98765432100',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Cartão'  },
  { id: 3,  data: '14/05/2024', hora: '09:00', paciente: 'Ana Paula Lima',    pagador: 'Plano Saúde ABC',  cpfPaciente: '11122233344', cpfPagador: '12345678000190', valorNum: 300,    valor: fmt(300),    situacao: 'pendente',  recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'pronto', servico: 'Sessão',    formaPagamento: 'PIX'     },
  { id: 4,  data: '13/05/2024', hora: '16:30', paciente: 'Carlos Eduardo',    pagador: 'Carlos Eduardo',    cpfPaciente: '44455566677', cpfPagador: '44455566677',    valorNum: 150,    valor: fmt(150),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'nao',    servico: 'Consulta',  formaPagamento: 'Dinheiro'},
  { id: 5,  data: '10/05/2024', hora: '11:00', paciente: 'Juliana Martins',   pagador: 'Juliana Martins',   cpfPaciente: '88899900011', cpfPagador: '88899900011',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Cartão'  },
  { id: 6,  data: '09/05/2024', hora: '08:30', paciente: 'Roberto Alves',     pagador: 'Roberto Alves',     cpfPaciente: '33344455566', cpfPagador: '33344455566',    valorNum: 220,    valor: fmt(220),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessão',    formaPagamento: 'PIX'     },
  { id: 7,  data: '08/05/2024', hora: '15:00', paciente: 'Fernanda Costa',    pagador: 'Fernanda Costa',    cpfPaciente: '55566677788', cpfPagador: '55566677788',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Cartão'  },
  { id: 8,  data: '07/05/2024', hora: '10:00', paciente: 'Lucas Mendes',      pagador: 'Convênio Saúde+',  cpfPaciente: '77788899900', cpfPagador: '98765432000181', valorNum: 350,    valor: fmt(350),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessão',    formaPagamento: 'Dinheiro'},
  { id: 9,  data: '06/05/2024', hora: '09:30', paciente: 'Patricia Lima',     pagador: 'Patricia Lima',     cpfPaciente: '11223344556', cpfPagador: '11223344556',    valorNum: 250,    valor: fmt(250),    situacao: 'cancelado', recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'nao',    servico: 'Consulta',  formaPagamento: 'PIX'     },
  { id: 10, data: '05/05/2024', hora: '13:00', paciente: 'Thiago Souza',      pagador: 'Thiago Souza',      cpfPaciente: '99887766554', cpfPagador: '99887766554',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Cartão'  },
  { id: 11, data: '04/05/2024', hora: '14:30', paciente: 'Camila Rocha',      pagador: 'Camila Rocha',      cpfPaciente: '66554433221', cpfPagador: '66554433221',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessão',    formaPagamento: 'PIX'     },
  { id: 12, data: '03/05/2024', hora: '11:30', paciente: 'Diego Ferreira',    pagador: 'Diego Ferreira',    cpfPaciente: '44332211009', cpfPagador: '44332211009',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Dinheiro'},
  { id: 13, data: '02/05/2024', hora: '08:00', paciente: 'Amanda Santos',     pagador: 'Amanda Santos',     cpfPaciente: '22110099887', cpfPagador: '22110099887',    valorNum: 300,    valor: fmt(300),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Cartão'  },
  { id: 14, data: '01/05/2024', hora: '16:00', paciente: 'Bruno Oliveira',    pagador: 'Bruno Oliveira',    cpfPaciente: '88776655443', cpfPagador: '88776655443',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'PIX'     },
  { id: 15, data: '30/04/2024', hora: '10:00', paciente: 'Larissa Pereira',   pagador: 'Larissa Pereira',   cpfPaciente: '55443322110', cpfPagador: '55443322110',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessão',    formaPagamento: 'Cartão'  },
  { id: 16, data: '29/04/2024', hora: '15:30', paciente: 'Marcos Vieira',     pagador: 'Plano Saúde ABC',  cpfPaciente: '33221100998', cpfPagador: '12345678000190', valorNum: 350,    valor: fmt(350),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'PIX'     },
  { id: 17, data: '28/04/2024', hora: '09:00', paciente: 'Isabela Gomes',     pagador: 'Isabela Gomes',     cpfPaciente: '11009988776', cpfPagador: '11009988776',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Cartão'  },
  { id: 18, data: '27/04/2024', hora: '14:00', paciente: 'Rafael Nascimento', pagador: 'Rafael Nascimento', cpfPaciente: '99008877665', cpfPagador: '99008877665',    valorNum: 180,    valor: fmt(180),    situacao: 'cancelado', recebimento: 'pendente',  documentacao: 'pendente',  nfStatus: 'pendente', receitaSaude: 'nao',    servico: 'Sessão',    formaPagamento: 'Dinheiro'},
  { id: 19, data: '26/04/2024', hora: '11:00', paciente: 'Vanessa Ribeiro',   pagador: 'Vanessa Ribeiro',   cpfPaciente: '77665544332', cpfPagador: '77665544332',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'PIX'     },
  { id: 20, data: '25/04/2024', hora: '08:30', paciente: 'Eduardo Silva',     pagador: 'Eduardo Silva',     cpfPaciente: '55443322119', cpfPagador: '55443322119',    valorNum: 300,    valor: fmt(300),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessão',    formaPagamento: 'Cartão'  },
  { id: 21, data: '24/04/2024', hora: '16:00', paciente: 'Natalia Castro',    pagador: 'Natalia Castro',    cpfPaciente: '33221100881', cpfPagador: '33221100881',    valorNum: 180,    valor: fmt(180),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'PIX'     },
  { id: 22, data: '23/04/2024', hora: '10:30', paciente: 'Henrique Lima',     pagador: 'Henrique Lima',     cpfPaciente: '11220099887', cpfPagador: '11220099887',    valorNum: 250,    valor: fmt(250),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'Cartão'  },
  { id: 23, data: '22/04/2024', hora: '13:30', paciente: 'Beatriz Alves',     pagador: 'Beatriz Alves',     cpfPaciente: '99887766441', cpfPagador: '99887766441',    valorNum: 200,    valor: fmt(200),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessão',    formaPagamento: 'Dinheiro'},
  { id: 24, data: '21/04/2024', hora: '09:00', paciente: 'Gustavo Martins',   pagador: 'Gustavo Martins',   cpfPaciente: '77665522110', cpfPagador: '77665522110',    valorNum: 220,    valor: fmt(220),    situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa',  nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta',  formaPagamento: 'PIX'     },
];

const mockDespesas = [
  { id: 1,  data: '16/05/2024', descricao: 'Aluguel sala comercial',  categoria: 'Aluguel',               valorNum: 1200,  valor: fmt(1200),  formaPagamento: 'Pix',     comprovante: true  },
  { id: 2,  data: '15/05/2024', descricao: 'Internet',                categoria: 'Internet',              valorNum: 120,   valor: fmt(120),   formaPagamento: 'Débito',  comprovante: true  },
  { id: 3,  data: '14/05/2024', descricao: 'Material de escritório',  categoria: 'Materiais',             valorNum: 85.5,  valor: fmt(85.5),  formaPagamento: 'Crédito', comprovante: false },
  { id: 4,  data: '13/05/2024', descricao: 'Sistema de gestão',       categoria: 'Software / Sistema',    valorNum: 89.9,  valor: fmt(89.9),  formaPagamento: 'Pix',     comprovante: false },
  { id: 5,  data: '10/05/2024', descricao: 'Combustível',             categoria: 'Combustível',           valorNum: 75,    valor: fmt(75),    formaPagamento: 'Débito',  comprovante: false },
  { id: 6,  data: '08/05/2024', descricao: 'Plano de telefone',       categoria: 'Telefone',              valorNum: 89.9,  valor: fmt(89.9),  formaPagamento: 'Débito',  comprovante: true  },
  { id: 7,  data: '07/05/2024', descricao: 'Energia elétrica',        categoria: 'Energia',               valorNum: 180,   valor: fmt(180),   formaPagamento: 'Débito',  comprovante: true  },
  { id: 8,  data: '05/05/2024', descricao: 'Conta de água',           categoria: 'Água',                  valorNum: 45,    valor: fmt(45),    formaPagamento: 'Débito',  comprovante: true  },
  { id: 9,  data: '04/05/2024', descricao: 'Equipamentos clínicos',   categoria: 'Equipamentos',          valorNum: 320,   valor: fmt(320),   formaPagamento: 'Crédito', comprovante: true  },
  { id: 10, data: '03/05/2024', descricao: 'Serviço de limpeza',      categoria: 'Limpeza',               valorNum: 95,    valor: fmt(95),    formaPagamento: 'Pix',     comprovante: false },
  { id: 11, data: '02/05/2024', descricao: 'Transporte / Uber',       categoria: 'Transporte',            valorNum: 120,   valor: fmt(120),   formaPagamento: 'Dinheiro',comprovante: false },
  { id: 12, data: '30/04/2024', descricao: 'Anuidade CRP',            categoria: 'Conselho profissional', valorNum: 350,   valor: fmt(350),   formaPagamento: 'Pix',     comprovante: true  },
  { id: 13, data: '29/04/2024', descricao: 'Marketing digital',       categoria: 'Marketing',             valorNum: 250,   valor: fmt(250),   formaPagamento: 'Pix',     comprovante: true  },
  { id: 14, data: '28/04/2024', descricao: 'Impressão e papel',       categoria: 'Materiais',             valorNum: 68,    valor: fmt(68),    formaPagamento: 'Dinheiro',comprovante: false },
  { id: 15, data: '27/04/2024', descricao: 'Assinatura Netflix/Spotify', categoria: 'Assinaturas',        valorNum: 49.9,  valor: fmt(49.9),  formaPagamento: 'Crédito', comprovante: false },
  { id: 16, data: '25/04/2024', descricao: 'Manutenção de equipamentos', categoria: 'Manutenção',         valorNum: 180,   valor: fmt(180),   formaPagamento: 'Pix',     comprovante: true  },
  { id: 17, data: '23/04/2024', descricao: 'Curso de capacitação',    categoria: 'Cursos',                valorNum: 350,   valor: fmt(350),   formaPagamento: 'Crédito', comprovante: true  },
  { id: 18, data: '21/04/2024', descricao: 'Alimentação',             categoria: 'Alimentação',           valorNum: 76.8,  valor: fmt(76.8),  formaPagamento: 'Dinheiro',comprovante: false },
];

const mockPacientes = [
  { id: 1,  nome: 'Maria Oliveira',   cpf: '123.456.789-01', telefone: '(11) 99999-1111', email: 'maria@email.com',    ultimoAtendimento: '16/05/2024' },
  { id: 2,  nome: 'João Souza',        cpf: '987.654.321-00', telefone: '(11) 98888-2222', email: 'joao@email.com',     ultimoAtendimento: '15/05/2024' },
  { id: 3,  nome: 'Ana Paula Lima',    cpf: '111.222.333-44', telefone: '(11) 97777-3333', email: 'ana@email.com',      ultimoAtendimento: '14/05/2024' },
  { id: 4,  nome: 'Carlos Eduardo',    cpf: '444.555.666-77', telefone: '(11) 96666-4444', email: 'carlos@email.com',   ultimoAtendimento: '13/05/2024' },
  { id: 5,  nome: 'Juliana Martins',   cpf: '555.666.777-88', telefone: '(11) 95555-5555', email: 'juliana@email.com',  ultimoAtendimento: '10/05/2024' },
  { id: 6,  nome: 'Roberto Alves',     cpf: '333.444.555-66', telefone: '(11) 94444-6666', email: 'roberto@email.com',  ultimoAtendimento: '09/05/2024' },
  { id: 7,  nome: 'Fernanda Costa',    cpf: '555.666.777-88', telefone: '(11) 93333-7777', email: 'fernanda@email.com', ultimoAtendimento: '08/05/2024' },
  { id: 8,  nome: 'Lucas Mendes',      cpf: '777.888.999-00', telefone: '(11) 92222-8888', email: 'lucas@email.com',    ultimoAtendimento: '07/05/2024' },
  { id: 9,  nome: 'Patricia Lima',     cpf: '112.233.445-56', telefone: '(11) 91111-9999', email: 'patricia@email.com', ultimoAtendimento: '06/05/2024' },
  { id: 10, nome: 'Thiago Souza',      cpf: '998.877.665-54', telefone: '(11) 90000-1010', email: 'thiago@email.com',   ultimoAtendimento: '05/05/2024' },
  { id: 11, nome: 'Camila Rocha',      cpf: '665.544.332-21', telefone: '(11) 99111-1111', email: 'camila@email.com',   ultimoAtendimento: '04/05/2024' },
  { id: 12, nome: 'Diego Ferreira',    cpf: '443.322.110-09', telefone: '(11) 98222-2222', email: 'diego@email.com',    ultimoAtendimento: '03/05/2024' },
  { id: 13, nome: 'Amanda Santos',     cpf: '221.100.998-87', telefone: '(11) 97333-3333', email: 'amanda@email.com',   ultimoAtendimento: '02/05/2024' },
  { id: 14, nome: 'Bruno Oliveira',    cpf: '887.766.554-43', telefone: '(11) 96444-4444', email: 'bruno@email.com',    ultimoAtendimento: '01/05/2024' },
  { id: 15, nome: 'Larissa Pereira',   cpf: '554.433.221-10', telefone: '(11) 95555-5555', email: 'larissa@email.com',  ultimoAtendimento: '30/04/2024' },
  { id: 16, nome: 'Marcos Vieira',     cpf: '332.211.009-98', telefone: '(11) 94666-6666', email: 'marcos@email.com',   ultimoAtendimento: '29/04/2024' },
  { id: 17, nome: 'Isabela Gomes',     cpf: '110.099.887-76', telefone: '(11) 93777-7777', email: 'isabela@email.com',  ultimoAtendimento: '28/04/2024' },
  { id: 18, nome: 'Rafael Nascimento', cpf: '990.088.776-65', telefone: '(11) 92888-8888', email: 'rafael@email.com',   ultimoAtendimento: '27/04/2024' },
  { id: 19, nome: 'Vanessa Ribeiro',   cpf: '776.655.443-32', telefone: '(11) 91999-9999', email: 'vanessa@email.com',  ultimoAtendimento: '26/04/2024' },
  { id: 20, nome: 'Eduardo Silva',     cpf: '554.433.221-19', telefone: '(11) 90000-0101', email: 'eduardo@email.com',  ultimoAtendimento: '25/04/2024' },
  { id: 21, nome: 'Natalia Castro',    cpf: '332.211.008-81', telefone: '(11) 99111-2222', email: 'natalia@email.com',  ultimoAtendimento: '24/04/2024' },
  { id: 22, nome: 'Henrique Lima',     cpf: '112.200.998-87', telefone: '(11) 98222-3333', email: 'henrique@email.com', ultimoAtendimento: '23/04/2024' },
  { id: 23, nome: 'Beatriz Alves',     cpf: '998.877.664-41', telefone: '(11) 97333-4444', email: 'beatriz@email.com',  ultimoAtendimento: '22/04/2024' },
  { id: 24, nome: 'Gustavo Martins',   cpf: '776.655.221-10', telefone: '(11) 96444-5555', email: 'gustavo@email.com',  ultimoAtendimento: '21/04/2024' },
];

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [atendimentos, setAtendimentos] = useState(mockAtendimentos);
  const [despesas, setDespesas]         = useState(mockDespesas);
  const [pacientes, setPacientes]       = useState(mockPacientes);

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

  /* ── Pacientes ── */
  function addPaciente(item) {
    setPacientes((prev) => [{ ...item, id: Date.now() }, ...prev]);
  }
  function updatePaciente(id, item) {
    setPacientes((prev) => prev.map((p) => (p.id === id ? { ...p, ...item } : p)));
  }
  function deletePaciente(id) {
    setPacientes((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <DataContext.Provider value={{
      atendimentos, addAtendimento, updateAtendimento, deleteAtendimento,
      despesas,     addDespesa,     updateDespesa,     deleteDespesa,
      pacientes,    addPaciente,    updatePaciente,    deletePaciente,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
