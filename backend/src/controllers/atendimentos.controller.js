let atendimentos = [
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
    precisa_doc: true,
    observacoes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function listarAtendimentos(request, response) {
  // TODO: substituir dados mockados
  return response.json(atendimentos);
}

export async function criarAtendimento(request, response) {
  const now = new Date().toISOString();
  const atendimento = {
    id: Date.now(),
    usuario_id: 1,
    ...request.body,
    created_at: now,
    updated_at: now
  };

  // TODO: salvar no PostgreSQL
  atendimentos = [atendimento, ...atendimentos];
  return response.status(201).json(atendimento);
}

export async function atualizarAtendimento(request, response) {
  const id = Number(request.params.id);
  const index = atendimentos.findIndex((item) => item.id === id);

  if (index === -1) {
    return response.status(404).json({
      message: 'Atendimento não encontrado.'
    });
  }

  const atendimento = {
    ...atendimentos[index],
    ...request.body,
    updated_at: new Date().toISOString()
  };

  // TODO: salvar no PostgreSQL
  atendimentos[index] = atendimento;
  return response.json(atendimento);
}

export async function excluirAtendimento(request, response) {
  const id = Number(request.params.id);
  const exists = atendimentos.some((item) => item.id === id);

  if (!exists) {
    return response.status(404).json({
      message: 'Atendimento não encontrado.'
    });
  }

  // TODO: salvar no PostgreSQL
  atendimentos = atendimentos.filter((item) => item.id !== id);
  return response.status(204).send();
}
