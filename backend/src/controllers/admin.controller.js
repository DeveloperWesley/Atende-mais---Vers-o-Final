import { query } from '../database/connection.js';

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function formatUser(row) {
  return {
    id: Number(row.id),
    nome: row.nome,
    email: row.email,
    perfil: row.perfil,
    especialidade: row.especialidade || '',
    status: row.status,
    plano: row.plano,
    ultimoAcesso: row.ultimo_acesso
      ? new Date(row.ultimo_acesso).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : '—',
    totalAtendimentos: Number(row.total_atendimentos || 0),
    totalFaturamento: fmt(Number(row.total_faturamento || 0)),
    criadoEm: new Date(row.created_at).toISOString().slice(0, 10),
  };
}

export async function listarProfissionais(request, response) {
  const { rows } = await query(
    `SELECT u.*,
       COUNT(a.id) AS total_atendimentos,
       COALESCE(SUM(a.valor_num) FILTER (WHERE a.recebimento = 'recebido'), 0) AS total_faturamento
     FROM usuarios u
     LEFT JOIN atendimentos a ON a.usuario_id = u.id
     WHERE u.perfil = 'profissional'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return response.json(rows.map(formatUser));
}

export async function listarAtendimentosProfissional(request, response) {
  const id = Number(request.params.id);
  const { rows } = await query(
    'SELECT * FROM atendimentos WHERE usuario_id = $1 ORDER BY data DESC',
    [id]
  );
  return response.json(rows);
}

export async function aprovarUsuario(request, response) {
  const { rows } = await query(
    `UPDATE usuarios SET status = 'ativo' WHERE id=$1 AND perfil='profissional' RETURNING id`,
    [Number(request.params.id)]
  );
  if (rows.length === 0) return response.status(404).json({ message: 'Usuário não encontrado.' });
  return response.json({ message: 'Usuário aprovado com sucesso.' });
}

export async function rejeitarUsuario(request, response) {
  const { rows } = await query(
    `UPDATE usuarios SET status = 'inativo' WHERE id=$1 AND perfil='profissional' RETURNING id`,
    [Number(request.params.id)]
  );
  if (rows.length === 0) return response.status(404).json({ message: 'Usuário não encontrado.' });
  return response.json({ message: 'Usuário rejeitado.' });
}

export async function desativarUsuario(request, response) {
  const { rows } = await query(
    `UPDATE usuarios SET status = 'inativo' WHERE id=$1 AND perfil='profissional' RETURNING id`,
    [Number(request.params.id)]
  );
  if (rows.length === 0) return response.status(404).json({ message: 'Usuário não encontrado.' });
  return response.json({ message: 'Usuário desativado com sucesso.' });
}

export async function reativarUsuario(request, response) {
  const { rows } = await query(
    `UPDATE usuarios SET status = 'ativo' WHERE id=$1 AND perfil='profissional' RETURNING id`,
    [Number(request.params.id)]
  );
  if (rows.length === 0) return response.status(404).json({ message: 'Usuário não encontrado.' });
  return response.json({ message: 'Usuário reativado com sucesso.' });
}

export async function exportarAtendimentos(request, response) {
  const { usuario_id, data_inicio, data_fim } = request.query;

  let sql = `SELECT a.*, u.nome AS profissional_nome
             FROM atendimentos a
             JOIN usuarios u ON u.id = a.usuario_id
             WHERE 1=1`;
  const params = [];

  if (usuario_id) {
    params.push(usuario_id);
    sql += ` AND a.usuario_id = $${params.length}`;
  }
  if (data_inicio) {
    params.push(data_inicio);
    sql += ` AND a.data >= $${params.length}`;
  }
  if (data_fim) {
    params.push(data_fim);
    sql += ` AND a.data <= $${params.length}`;
  }
  sql += ' ORDER BY a.data DESC';

  const { rows } = await query(sql, params);

  const header = ['data', 'profissional', 'paciente', 'pagador', 'cpf_pagador', 'valor', 'forma_pagamento', 'nf_status'];
  const csvRows = rows.map((r) =>
    [
      r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '',
      r.profissional_nome,
      r.paciente,
      r.pagador,
      r.cpf_pagador,
      r.valor_num,
      r.forma_pagamento,
      r.nf_status,
    ].join(';')
  );

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', 'attachment; filename="atendimentos.csv"');
  return response.send([header.join(';'), ...csvRows].join('\n'));
}
