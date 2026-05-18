import { query } from '../database/connection.js';

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return d.toLocaleDateString('pt-BR');
}

function parseDate(val) {
  if (!val) return null;
  // DD/MM/YYYY → YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/');
    return `${y}-${m}-${d}`;
  }
  return val;
}

function cleanDoc(val) {
  return (val || '').replace(/\D/g, '');
}

function toRow(row) {
  return {
    id: Number(row.id),
    data: formatDate(row.data),
    hora: row.hora || '—',
    paciente: row.paciente,
    pagador: row.pagador,
    cpfPaciente: row.cpf_paciente,
    cpfPagador: row.cpf_pagador,
    valorNum: parseFloat(row.valor_num),
    valor: fmt(parseFloat(row.valor_num)),
    situacao: row.situacao,
    recebimento: row.recebimento,
    documentacao: row.documentacao,
    nfStatus: row.nf_status,
    receitaSaude: row.receita_saude,
    servico: row.servico,
    formaPagamento: row.forma_pagamento,
    precisaDoc: row.precisa_doc,
    observacoes: row.observacoes || '',
  };
}

export async function listarAtendimentos(request, response) {
  const { rows } = await query(
    'SELECT * FROM atendimentos WHERE usuario_id = $1 ORDER BY data DESC, created_at DESC',
    [request.user.id]
  );
  return response.json(rows.map(toRow));
}

export async function criarAtendimento(request, response) {
  const b = request.body;
  const { rows } = await query(
    `INSERT INTO atendimentos
      (usuario_id, data, hora, paciente, pagador, cpf_paciente, cpf_pagador, valor_num,
       situacao, recebimento, documentacao, nf_status, receita_saude, servico,
       forma_pagamento, precisa_doc, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      request.user.id,
      parseDate(b.data || b.dataAtendimento),
      b.hora || null,
      b.paciente || b.pacienteNome,
      b.pagador || b.pagadorNome,
      cleanDoc(b.cpfPaciente || b.pacienteCpf),
      cleanDoc(b.cpfPagador || b.pagadorDoc),
      b.valorNum,
      b.situacao || 'concluido',
      b.recebimento || 'recebido',
      b.documentacao || 'pendente',
      b.nfStatus || 'pendente',
      b.receitaSaude || 'pronto',
      b.servico || 'Consulta',
      b.formaPagamento || 'PIX',
      b.precisaDoc ?? false,
      b.observacoes || null,
    ]
  );
  return response.status(201).json(toRow(rows[0]));
}

export async function atualizarAtendimento(request, response) {
  const id = Number(request.params.id);
  const b = request.body;

  const { rows } = await query(
    `UPDATE atendimentos SET
      data=$1, hora=$2, paciente=$3, pagador=$4, cpf_paciente=$5, cpf_pagador=$6,
      valor_num=$7, situacao=$8, recebimento=$9, documentacao=$10, nf_status=$11,
      receita_saude=$12, servico=$13, forma_pagamento=$14, precisa_doc=$15, observacoes=$16
     WHERE id=$17 AND usuario_id=$18
     RETURNING *`,
    [
      parseDate(b.data || b.dataAtendimento),
      b.hora || null,
      b.paciente || b.pacienteNome,
      b.pagador || b.pagadorNome,
      cleanDoc(b.cpfPaciente || b.pacienteCpf),
      cleanDoc(b.cpfPagador || b.pagadorDoc),
      b.valorNum,
      b.situacao || 'concluido',
      b.recebimento || 'recebido',
      b.documentacao || 'pendente',
      b.nfStatus || 'pendente',
      b.receitaSaude || 'pronto',
      b.servico || 'Consulta',
      b.formaPagamento || 'PIX',
      b.precisaDoc ?? false,
      b.observacoes || null,
      id,
      request.user.id,
    ]
  );

  if (rows.length === 0) {
    return response.status(404).json({ message: 'Atendimento não encontrado.' });
  }
  return response.json(toRow(rows[0]));
}

export async function excluirAtendimento(request, response) {
  const { rowCount } = await query(
    'DELETE FROM atendimentos WHERE id=$1 AND usuario_id=$2',
    [Number(request.params.id), request.user.id]
  );
  if (rowCount === 0) {
    return response.status(404).json({ message: 'Atendimento não encontrado.' });
  }
  return response.status(204).send();
}
