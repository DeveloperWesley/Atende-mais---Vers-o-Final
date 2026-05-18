import { query } from '../database/connection.js';

function formatCpf(cpf) {
  const c = (cpf || '').replace(/\D/g, '');
  if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return cpf;
}

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('pt-BR');
}

function cleanCpf(val) {
  return (val || '').replace(/\D/g, '');
}

function toRow(row) {
  return {
    id: Number(row.id),
    nome: row.nome,
    cpf: formatCpf(row.cpf),
    telefone: row.telefone || '',
    email: row.email || '',
    ultimoAtendimento: formatDate(row.ultimo_atendimento),
  };
}

export async function listarPacientes(request, response) {
  const { rows } = await query(
    `SELECT p.*,
       (SELECT MAX(a.data)
        FROM atendimentos a
        WHERE a.usuario_id = p.usuario_id AND a.cpf_paciente = p.cpf
       ) AS ultimo_atendimento
     FROM pacientes p
     WHERE p.usuario_id = $1
     ORDER BY p.nome`,
    [request.user.id]
  );
  return response.json(rows.map(toRow));
}

export async function criarPaciente(request, response) {
  const b = request.body;
  const cpf = cleanCpf(b.cpf);

  const { rows: existing } = await query(
    'SELECT id FROM pacientes WHERE usuario_id=$1 AND cpf=$2',
    [request.user.id, cpf]
  );
  if (existing.length > 0) {
    return response.status(409).json({ message: 'Já existe um paciente com este CPF.' });
  }

  const { rows } = await query(
    `INSERT INTO pacientes (usuario_id, nome, cpf, telefone, email)
     VALUES ($1,$2,$3,$4,$5) RETURNING *, NULL::date AS ultimo_atendimento`,
    [request.user.id, b.nome, cpf, b.telefone || null, b.email || null]
  );
  return response.status(201).json(toRow(rows[0]));
}

export async function atualizarPaciente(request, response) {
  const id = Number(request.params.id);
  const b = request.body;
  const cpf = cleanCpf(b.cpf);

  const { rows } = await query(
    `UPDATE pacientes SET nome=$1, cpf=$2, telefone=$3, email=$4
     WHERE id=$5 AND usuario_id=$6 RETURNING *`,
    [b.nome, cpf, b.telefone || null, b.email || null, id, request.user.id]
  );
  if (rows.length === 0) {
    return response.status(404).json({ message: 'Paciente não encontrado.' });
  }

  const { rows: atRows } = await query(
    'SELECT MAX(data) AS ultimo FROM atendimentos WHERE usuario_id=$1 AND cpf_paciente=$2',
    [request.user.id, rows[0].cpf]
  );
  return response.json(toRow({ ...rows[0], ultimo_atendimento: atRows[0]?.ultimo }));
}

export async function excluirPaciente(request, response) {
  const { rowCount } = await query(
    'DELETE FROM pacientes WHERE id=$1 AND usuario_id=$2',
    [Number(request.params.id), request.user.id]
  );
  if (rowCount === 0) {
    return response.status(404).json({ message: 'Paciente não encontrado.' });
  }
  return response.status(204).send();
}
