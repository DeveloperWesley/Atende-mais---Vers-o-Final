import { query } from '../database/connection.js';

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('pt-BR');
}

function parseDate(val) {
  if (!val) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/');
    return `${y}-${m}-${d}`;
  }
  return val;
}

function toRow(row) {
  return {
    id: Number(row.id),
    data: formatDate(row.data),
    descricao: row.descricao,
    categoria: row.categoria,
    valorNum: parseFloat(row.valor_num),
    valor: fmt(parseFloat(row.valor_num)),
    formaPagamento: row.forma_pagamento,
    comprovante: Boolean(row.comprovante_url),
    comprovanteUrl: row.comprovante_url || null,
  };
}

export async function listarDespesas(request, response) {
  const { rows } = await query(
    'SELECT * FROM despesas WHERE usuario_id = $1 ORDER BY data DESC, created_at DESC',
    [request.user.id]
  );
  return response.json(rows.map(toRow));
}

export async function criarDespesa(request, response) {
  const b = request.body;
  const { rows } = await query(
    `INSERT INTO despesas (usuario_id, data, descricao, categoria, valor_num, forma_pagamento, comprovante_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      request.user.id,
      parseDate(b.data),
      b.descricao,
      b.categoria,
      b.valorNum,
      b.formaPagamento,
      b.comprovanteUrl || null,
    ]
  );
  return response.status(201).json(toRow(rows[0]));
}

export async function atualizarDespesa(request, response) {
  const id = Number(request.params.id);
  const b = request.body;
  const { rows } = await query(
    `UPDATE despesas SET data=$1, descricao=$2, categoria=$3, valor_num=$4,
      forma_pagamento=$5, comprovante_url=$6
     WHERE id=$7 AND usuario_id=$8 RETURNING *`,
    [
      parseDate(b.data),
      b.descricao,
      b.categoria,
      b.valorNum,
      b.formaPagamento,
      b.comprovanteUrl || null,
      id,
      request.user.id,
    ]
  );
  if (rows.length === 0) {
    return response.status(404).json({ message: 'Despesa não encontrada.' });
  }
  return response.json(toRow(rows[0]));
}

export async function excluirDespesa(request, response) {
  const { rowCount } = await query(
    'DELETE FROM despesas WHERE id=$1 AND usuario_id=$2',
    [Number(request.params.id), request.user.id]
  );
  if (rowCount === 0) {
    return response.status(404).json({ message: 'Despesa não encontrada.' });
  }
  return response.status(204).send();
}
