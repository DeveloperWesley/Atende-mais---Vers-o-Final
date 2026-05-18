import http from 'http';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3333, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(opts, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch { resolve(s); } });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  const l = await req('POST', '/auth/login', { email: 'carlos@atende.com', senha: 'Teste@123' });
  if (!l.token) { console.error('Login falhou:', l.message); process.exit(1); }
  const token = l.token;
  console.log('Logado como:', l.user.nome);

  /* ── PACIENTES ── */
  const pacientesData = [
    { nome: 'Maria Oliveira',   cpf: '12345678901', telefone: '(11) 99999-1111', email: 'maria.oliveira@email.com'  },
    { nome: 'Joao Souza',       cpf: '98765432100', telefone: '(11) 98888-2222', email: 'joao.souza@email.com'      },
    { nome: 'Ana Paula Lima',   cpf: '11122233344', telefone: '(11) 97777-3333', email: 'ana.lima@email.com'        },
    { nome: 'Carlos Eduardo',   cpf: '44455566677', telefone: '(11) 96666-4444', email: 'carlos.eduardo@email.com'  },
    { nome: 'Juliana Martins',  cpf: '88899900011', telefone: '(11) 95555-5555', email: 'juliana@email.com'         },
    { nome: 'Roberto Alves',    cpf: '33344455566', telefone: '(11) 94444-6666', email: 'roberto.alves@email.com'   },
    { nome: 'Fernanda Costa',   cpf: '55566677788', telefone: '(11) 93333-7777', email: 'fernanda.costa@email.com'  },
    { nome: 'Lucas Mendes',     cpf: '77788899900', telefone: '(11) 92222-8888', email: 'lucas.mendes@email.com'    },
  ];
  for (const p of pacientesData) await req('POST', '/pacientes', p, token);
  console.log('Pacientes criados:', pacientesData.length);

  /* ── ATENDIMENTOS ── */
  const ats = [
    { data: '2024-05-20', paciente: 'Maria Oliveira',   pagador: 'Maria Oliveira',   cpfPaciente: '12345678901', cpfPagador: '12345678901',    valorNum: 250,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta', formaPagamento: 'PIX',      precisaDoc: true,  observacoes: 'Retorno mensal' },
    { data: '2024-05-18', paciente: 'Joao Souza',       pagador: 'Joao Souza',       cpfPaciente: '98765432100', cpfPagador: '98765432100',    valorNum: 180,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessao',   formaPagamento: 'Cartao',   precisaDoc: false, observacoes: '' },
    { data: '2024-05-16', paciente: 'Ana Paula Lima',   pagador: 'Plano Saude ABC',  cpfPaciente: '11122233344', cpfPagador: '12345678000190', valorNum: 300,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta', formaPagamento: 'PIX',      precisaDoc: true,  observacoes: 'Convenio' },
    { data: '2024-05-15', paciente: 'Carlos Eduardo',   pagador: 'Carlos Eduardo',   cpfPaciente: '44455566677', cpfPagador: '44455566677',    valorNum: 150,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'nao',    servico: 'Consulta', formaPagamento: 'Dinheiro', precisaDoc: false, observacoes: '' },
    { data: '2024-05-13', paciente: 'Juliana Martins',  pagador: 'Juliana Martins',  cpfPaciente: '88899900011', cpfPagador: '88899900011',    valorNum: 200,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessao',   formaPagamento: 'Cartao',   precisaDoc: true,  observacoes: '' },
    { data: '2024-05-10', paciente: 'Roberto Alves',    pagador: 'Roberto Alves',    cpfPaciente: '33344455566', cpfPagador: '33344455566',    valorNum: 220,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta', formaPagamento: 'PIX',      precisaDoc: false, observacoes: 'Primeira consulta' },
    { data: '2024-05-08', paciente: 'Fernanda Costa',   pagador: 'Fernanda Costa',   cpfPaciente: '55566677788', cpfPagador: '55566677788',    valorNum: 180,  situacao: 'pendente',  recebimento: 'pendente',  documentacao: 'pendente', nfStatus: 'pendente', receitaSaude: 'nao',    servico: 'Sessao',   formaPagamento: 'PIX',      precisaDoc: false, observacoes: '' },
    { data: '2024-05-05', paciente: 'Lucas Mendes',     pagador: 'Convenio Saude+',  cpfPaciente: '77788899900', cpfPagador: '98765432000181', valorNum: 350,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta', formaPagamento: 'Cartao',   precisaDoc: true,  observacoes: 'Plano empresarial' },
    { data: '2024-05-03', paciente: 'Maria Oliveira',   pagador: 'Maria Oliveira',   cpfPaciente: '12345678901', cpfPagador: '12345678901',    valorNum: 250,  situacao: 'cancelado', recebimento: 'pendente',  documentacao: 'pendente', nfStatus: 'pendente', receitaSaude: 'nao',    servico: 'Sessao',   formaPagamento: 'PIX',      precisaDoc: false, observacoes: 'Paciente cancelou' },
    { data: '2024-05-01', paciente: 'Joao Souza',       pagador: 'Joao Souza',       cpfPaciente: '98765432100', cpfPagador: '98765432100',    valorNum: 180,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessao',   formaPagamento: 'Cartao',   precisaDoc: false, observacoes: '' },
    { data: '2024-04-29', paciente: 'Ana Paula Lima',   pagador: 'Plano Saude ABC',  cpfPaciente: '11122233344', cpfPagador: '12345678000190', valorNum: 300,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta', formaPagamento: 'PIX',      precisaDoc: true,  observacoes: '' },
    { data: '2024-04-25', paciente: 'Juliana Martins',  pagador: 'Juliana Martins',  cpfPaciente: '88899900011', cpfPagador: '88899900011',    valorNum: 200,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Consulta', formaPagamento: 'Dinheiro', precisaDoc: false, observacoes: '' },
    { data: '2024-04-22', paciente: 'Carlos Eduardo',   pagador: 'Carlos Eduardo',   cpfPaciente: '44455566677', cpfPagador: '44455566677',    valorNum: 150,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'nao',    servico: 'Sessao',   formaPagamento: 'Cartao',   precisaDoc: false, observacoes: '' },
    { data: '2024-04-20', paciente: 'Roberto Alves',    pagador: 'Roberto Alves',    cpfPaciente: '33344455566', cpfPagador: '33344455566',    valorNum: 220,  situacao: 'pendente',  recebimento: 'pendente',  documentacao: 'pendente', nfStatus: 'pendente', receitaSaude: 'pronto', servico: 'Consulta', formaPagamento: 'PIX',      precisaDoc: true,  observacoes: 'Aguardando pagamento' },
    { data: '2024-04-17', paciente: 'Fernanda Costa',   pagador: 'Fernanda Costa',   cpfPaciente: '55566677788', cpfPagador: '55566677788',    valorNum: 180,  situacao: 'concluido', recebimento: 'recebido',  documentacao: 'completa', nfStatus: 'emitido',  receitaSaude: 'pronto', servico: 'Sessao',   formaPagamento: 'Dinheiro', precisaDoc: false, observacoes: '' },
  ];
  for (const a of ats) await req('POST', '/atendimentos', a, token);
  console.log('Atendimentos criados:', ats.length);

  /* ── DESPESAS ── */
  const desps = [
    { data: '2024-05-20', descricao: 'Aluguel sala clinica',         categoria: 'Aluguel',               valorNum: 1200,  formaPagamento: 'Pix'         },
    { data: '2024-05-18', descricao: 'Internet banda larga',         categoria: 'Internet',              valorNum: 120,   formaPagamento: 'Debito'      },
    { data: '2024-05-15', descricao: 'Energia eletrica',             categoria: 'Energia',               valorNum: 185,   formaPagamento: 'Debito'      },
    { data: '2024-05-14', descricao: 'Sistema de gestao Atende+',    categoria: 'Software / Sistema',    valorNum: 89.9,  formaPagamento: 'Pix'         },
    { data: '2024-05-12', descricao: 'Material de escritorio',       categoria: 'Materiais',             valorNum: 95,    formaPagamento: 'Credito'     },
    { data: '2024-05-10', descricao: 'Anuidade CRP',                 categoria: 'Conselho profissional', valorNum: 380,   formaPagamento: 'Pix'         },
    { data: '2024-05-08', descricao: 'Plano de celular',             categoria: 'Telefone',              valorNum: 89.9,  formaPagamento: 'Debito'      },
    { data: '2024-05-07', descricao: 'Servico de limpeza',           categoria: 'Limpeza',               valorNum: 100,   formaPagamento: 'Dinheiro'    },
    { data: '2024-05-05', descricao: 'Combustivel',                  categoria: 'Combustivel',           valorNum: 75,    formaPagamento: 'Debito'      },
    { data: '2024-05-03', descricao: 'Curso de atualizacao clinica', categoria: 'Cursos',                valorNum: 350,   formaPagamento: 'Credito'     },
    { data: '2024-05-01', descricao: 'Conta de agua',                categoria: 'Agua',                  valorNum: 48,    formaPagamento: 'Debito'      },
    { data: '2024-04-29', descricao: 'Marketing Instagram Ads',      categoria: 'Marketing',             valorNum: 250,   formaPagamento: 'Pix'         },
    { data: '2024-04-25', descricao: 'Equipamentos clinicos',        categoria: 'Equipamentos',          valorNum: 320,   formaPagamento: 'Credito'     },
    { data: '2024-04-22', descricao: 'Manutencao de equipamentos',   categoria: 'Manutencao',            valorNum: 180,   formaPagamento: 'Pix'         },
    { data: '2024-04-20', descricao: 'Alimentacao',                  categoria: 'Alimentacao',           valorNum: 76.8,  formaPagamento: 'Dinheiro'    },
    { data: '2024-04-18', descricao: 'Assinatura Spotify Netflix',   categoria: 'Assinaturas',           valorNum: 49.9,  formaPagamento: 'Credito'     },
    { data: '2024-04-15', descricao: 'Transporte Uber',              categoria: 'Transporte',            valorNum: 120,   formaPagamento: 'Dinheiro'    },
    { data: '2024-04-10', descricao: 'Contador mensal',              categoria: 'Contador',              valorNum: 400,   formaPagamento: 'Pix'         },
  ];
  for (const d of desps) await req('POST', '/despesas', d, token);
  console.log('Despesas criadas:', desps.length);

  /* ── RESUMO ── */
  const atList = await req('GET', '/atendimentos', null, token);
  const dpList = await req('GET', '/despesas', null, token);
  const pcList = await req('GET', '/pacientes', null, token);
  const totalRec  = atList.filter(a => a.recebimento === 'recebido').reduce((s, a) => s + a.valorNum, 0);
  const totalDesp = dpList.reduce((s, d) => s + d.valorNum, 0);

  console.log('\n=== RESUMO ===');
  console.log('Pacientes:      ' + pcList.length);
  console.log('Atendimentos:   ' + atList.length);
  console.log('Despesas:       ' + dpList.length);
  console.log('Total recebido: R$ ' + totalRec.toFixed(2).replace('.', ','));
  console.log('Total despesas: R$ ' + totalDesp.toFixed(2).replace('.', ','));
  console.log('Lucro estimado: R$ ' + (totalRec - totalDesp).toFixed(2).replace('.', ','));
}

run().catch(console.error);
