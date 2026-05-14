const profissionais = [
  {
    id: 1,
    nome: 'Dr. João Silva',
    email: 'joao@atendeplus.com.br',
    perfil: 'profissional'
  },
  {
    id: 2,
    nome: 'Dra. Camila Rocha',
    email: 'camila@atendeplus.com.br',
    perfil: 'profissional'
  }
];

const atendimentos = [
  {
    id: 1,
    usuario_id: 1,
    data_atendimento: '2024-05-24',
    competencia: '2024-05',
    valor: 250,
    pagador_nome: 'Maria Oliveira',
    pagador_doc: '12345678901',
    paciente_nome: 'Maria Oliveira',
    paciente_cpf: '12345678901',
    precisa_doc: true
  },
  {
    id: 2,
    usuario_id: 1,
    data_atendimento: '2024-05-23',
    competencia: '2024-05',
    valor: 180,
    pagador_nome: 'João Santos',
    pagador_doc: '98765432100',
    paciente_nome: 'João Santos',
    paciente_cpf: '98765432100',
    precisa_doc: false
  }
];

export async function listarProfissionais(request, response) {
  // TODO: substituir dados mockados
  return response.json(profissionais);
}

export async function listarAtendimentosProfissional(request, response) {
  const id = Number(request.params.id);
  const data = atendimentos.filter((item) => item.usuario_id === id);

  // TODO: integrar com API real
  return response.json(data);
}

export async function exportarAtendimentos(request, response) {
  const header = [
    'data_atendimento',
    'competencia',
    'pagador_nome',
    'pagador_doc',
    'paciente_nome',
    'paciente_cpf',
    'valor',
    'precisa_doc'
  ];

  const rows = atendimentos.map((item) =>
    [
      item.data_atendimento,
      item.competencia,
      item.pagador_nome,
      item.pagador_doc,
      item.paciente_nome,
      item.paciente_cpf,
      item.valor,
      item.precisa_doc ? 'sim' : 'nao'
    ].join(';')
  );

  // TODO: integrar com API real
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', 'attachment; filename="atendimentos.csv"');
  return response.send([header.join(';'), ...rows].join('\n'));
}
