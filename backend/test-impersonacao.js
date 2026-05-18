import http from 'http';

function req(method, path, body, token, impId) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3333, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token  ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(impId  ? { 'X-Impersonate-Id': String(impId) } : {}),
        ...(data   ? { 'Content-Length': Buffer.byteLength(data) } : {}),
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

async function main() {
  // Reseta senha admin (caso esteja com hash corrompido)
  const rt = await req('POST', '/auth/esqueci-senha', { email: 'developerwesleymelo@gmail.com' });
  if (rt.token) await req('POST', '/auth/redefinir-senha', { token: rt.token, novaSenha: 'adm123' });

  // Cria Carlos
  const c = await req('POST', '/auth/enviar-codigo', {
    nome: 'Dr. Carlos Teste', email: 'carlos@atende.com',
    senha: 'Teste@123', especialidade: 'Psicologia', sexo: 'Masculino',
  });
  await req('POST', '/auth/verificar-codigo', { email: 'carlos@atende.com', codigo: c.codigo });

  // Login admin
  const admin = await req('POST', '/auth/login', { email: 'developerwesleymelo@gmail.com', senha: 'adm123' });
  const at = admin.token;
  if (!at) { console.error('Login admin falhou:', admin.message); return; }
  console.log('Admin logado OK');

  // Aprova Carlos
  const lista = await req('GET', '/admin/profissionais', null, at);
  const carlos = lista.find(u => u.email === 'carlos@atende.com');
  await req('PATCH', '/admin/profissionais/' + carlos.id + '/aprovar', {}, at);
  console.log('Carlos aprovado, ID:', carlos.id);

  // Login Carlos
  const cl = await req('POST', '/auth/login', { email: 'carlos@atende.com', senha: 'Teste@123' });
  const ct = cl.token;

  // Popula pacientes
  const pacs = [
    { nome: 'Maria Oliveira',  cpf: '12345678901', telefone: '(11) 99999-1111', email: 'maria@email.com'    },
    { nome: 'Joao Souza',      cpf: '98765432100', telefone: '(11) 98888-2222', email: 'joao@email.com'     },
    { nome: 'Ana Paula Lima',  cpf: '11122233344', telefone: '(11) 97777-3333', email: 'ana@email.com'      },
    { nome: 'Carlos Eduardo',  cpf: '44455566677', telefone: '(11) 96666-4444', email: 'ceduardo@email.com' },
    { nome: 'Juliana Martins', cpf: '88899900011', telefone: '(11) 95555-5555', email: 'juliana@email.com'  },
    { nome: 'Roberto Alves',   cpf: '33344455566', telefone: '(11) 94444-6666', email: 'roberto@email.com'  },
    { nome: 'Fernanda Costa',  cpf: '55566677788', telefone: '(11) 93333-7777', email: 'fernanda@email.com' },
    { nome: 'Lucas Mendes',    cpf: '77788899900', telefone: '(11) 92222-8888', email: 'lucas@email.com'    },
  ];
  for (const p of pacs) await req('POST', '/pacientes', p, ct);

  // Popula atendimentos
  const ats = [
    { data:'2024-05-20', paciente:'Maria Oliveira',  pagador:'Maria Oliveira',  cpfPaciente:'12345678901', cpfPagador:'12345678901',    valorNum:250, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Consulta', formaPagamento:'PIX',      precisaDoc:true,  observacoes:'Retorno mensal' },
    { data:'2024-05-18', paciente:'Joao Souza',      pagador:'Joao Souza',      cpfPaciente:'98765432100', cpfPagador:'98765432100',    valorNum:180, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Sessao',   formaPagamento:'Cartao',   precisaDoc:false, observacoes:'' },
    { data:'2024-05-16', paciente:'Ana Paula Lima',  pagador:'Plano Saude ABC', cpfPaciente:'11122233344', cpfPagador:'12345678000190', valorNum:300, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Consulta', formaPagamento:'PIX',      precisaDoc:true,  observacoes:'Convenio' },
    { data:'2024-05-15', paciente:'Carlos Eduardo',  pagador:'Carlos Eduardo',  cpfPaciente:'44455566677', cpfPagador:'44455566677',    valorNum:150, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'nao',    servico:'Consulta', formaPagamento:'Dinheiro', precisaDoc:false, observacoes:'' },
    { data:'2024-05-13', paciente:'Juliana Martins', pagador:'Juliana Martins', cpfPaciente:'88899900011', cpfPagador:'88899900011',    valorNum:200, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Sessao',   formaPagamento:'Cartao',   precisaDoc:true,  observacoes:'' },
    { data:'2024-05-10', paciente:'Roberto Alves',   pagador:'Roberto Alves',   cpfPaciente:'33344455566', cpfPagador:'33344455566',    valorNum:220, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Consulta', formaPagamento:'PIX',      precisaDoc:false, observacoes:'Primeira consulta' },
    { data:'2024-05-08', paciente:'Fernanda Costa',  pagador:'Fernanda Costa',  cpfPaciente:'55566677788', cpfPagador:'55566677788',    valorNum:180, situacao:'pendente',  recebimento:'pendente',  documentacao:'pendente', nfStatus:'pendente', receitaSaude:'nao',    servico:'Sessao',   formaPagamento:'PIX',      precisaDoc:false, observacoes:'' },
    { data:'2024-05-05', paciente:'Lucas Mendes',    pagador:'Convenio Saude',  cpfPaciente:'77788899900', cpfPagador:'98765432000181', valorNum:350, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Consulta', formaPagamento:'Cartao',   precisaDoc:true,  observacoes:'Plano empresarial' },
    { data:'2024-04-29', paciente:'Ana Paula Lima',  pagador:'Plano Saude ABC', cpfPaciente:'11122233344', cpfPagador:'12345678000190', valorNum:300, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Consulta', formaPagamento:'PIX',      precisaDoc:true,  observacoes:'' },
    { data:'2024-04-22', paciente:'Carlos Eduardo',  pagador:'Carlos Eduardo',  cpfPaciente:'44455566677', cpfPagador:'44455566677',    valorNum:150, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'nao',    servico:'Sessao',   formaPagamento:'Cartao',   precisaDoc:false, observacoes:'' },
    { data:'2024-04-20', paciente:'Roberto Alves',   pagador:'Roberto Alves',   cpfPaciente:'33344455566', cpfPagador:'33344455566',    valorNum:220, situacao:'pendente',  recebimento:'pendente',  documentacao:'pendente', nfStatus:'pendente', receitaSaude:'pronto', servico:'Consulta', formaPagamento:'PIX',      precisaDoc:true,  observacoes:'Aguardando pagamento' },
    { data:'2024-04-17', paciente:'Fernanda Costa',  pagador:'Fernanda Costa',  cpfPaciente:'55566677788', cpfPagador:'55566677788',    valorNum:180, situacao:'concluido', recebimento:'recebido',  documentacao:'completa', nfStatus:'emitido',  receitaSaude:'pronto', servico:'Sessao',   formaPagamento:'Dinheiro', precisaDoc:false, observacoes:'' },
  ];
  for (const a of ats) await req('POST', '/atendimentos', a, ct);

  // Popula despesas
  const desps = [
    { data:'2024-05-20', descricao:'Aluguel sala clinica',       categoria:'Aluguel',               valorNum:1200,  formaPagamento:'Pix'      },
    { data:'2024-05-18', descricao:'Internet',                   categoria:'Internet',              valorNum:120,   formaPagamento:'Debito'   },
    { data:'2024-05-15', descricao:'Energia eletrica',           categoria:'Energia',               valorNum:185,   formaPagamento:'Debito'   },
    { data:'2024-05-14', descricao:'Sistema Atende+',            categoria:'Software / Sistema',    valorNum:89.9,  formaPagamento:'Pix'      },
    { data:'2024-05-10', descricao:'Anuidade CRP',               categoria:'Conselho profissional', valorNum:380,   formaPagamento:'Pix'      },
    { data:'2024-05-08', descricao:'Plano celular',              categoria:'Telefone',              valorNum:89.9,  formaPagamento:'Debito'   },
    { data:'2024-05-05', descricao:'Combustivel',                categoria:'Combustivel',           valorNum:75,    formaPagamento:'Debito'   },
    { data:'2024-05-03', descricao:'Curso de atualizacao',       categoria:'Cursos',                valorNum:350,   formaPagamento:'Credito'  },
    { data:'2024-04-29', descricao:'Marketing Instagram Ads',    categoria:'Marketing',             valorNum:250,   formaPagamento:'Pix'      },
    { data:'2024-04-25', descricao:'Equipamentos clinicos',      categoria:'Equipamentos',          valorNum:320,   formaPagamento:'Credito'  },
    { data:'2024-04-10', descricao:'Contador mensal',            categoria:'Contador',              valorNum:400,   formaPagamento:'Pix'      },
  ];
  for (const d of desps) await req('POST', '/despesas', d, ct);

  console.log('Populado:', pacs.length, 'pacientes,', ats.length, 'atendimentos,', desps.length, 'despesas');

  // === TESTE DE IMPERSONAÇÃO ===
  const atsImp = await req('GET', '/atendimentos', null, at, carlos.id);
  const dpsImp = await req('GET', '/despesas',     null, at, carlos.id);
  const pcsImp = await req('GET', '/pacientes',    null, at, carlos.id);

  console.log('\n=== TESTE DE IMPERSONAÇÃO (admin vendo dados do Carlos) ===');
  console.log('Atendimentos:', Array.isArray(atsImp) ? atsImp.length + ' registros OK' : JSON.stringify(atsImp));
  console.log('Despesas:    ', Array.isArray(dpsImp) ? dpsImp.length + ' registros OK' : JSON.stringify(dpsImp));
  console.log('Pacientes:   ', Array.isArray(pcsImp) ? pcsImp.length + ' registros OK' : JSON.stringify(pcsImp));
}

main().catch(console.error);
