import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
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

export async function login(request, response) {
  const { email, senha } = request.body;
  if (!email || !senha) {
    return response.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  const { rows } = await query(
    `SELECT u.*,
       COUNT(a.id) AS total_atendimentos,
       COALESCE(SUM(a.valor_num) FILTER (WHERE a.recebimento = 'recebido'), 0) AS total_faturamento
     FROM usuarios u
     LEFT JOIN atendimentos a ON a.usuario_id = u.id
     WHERE u.email = $1
     GROUP BY u.id`,
    [email.toLowerCase().trim()]
  );

  const user = rows[0];
  if (!user) {
    return response.status(401).json({ message: 'E-mail ou senha incorretos.' });
  }
  if (user.status === 'pendente') {
    return response
      .status(403)
      .json({ message: 'Sua conta está aguardando aprovação do administrador.' });
  }
  if (user.status === 'inativo') {
    return response
      .status(403)
      .json({ message: 'Sua conta foi desativada. Entre em contato com o administrador.' });
  }

  const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
  if (!senhaCorreta) {
    return response.status(401).json({ message: 'E-mail ou senha incorretos.' });
  }

  await query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [user.id]);

  const token = jwt.sign(
    { id: Number(user.id), nome: user.nome, email: user.email, perfil: user.perfil },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return response.json({ token, user: formatUser(user) });
}

export async function registrar(request, response) {
  const { nome, email, senha, especialidade } = request.body;
  if (!nome || !email || !senha) {
    return response.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (senha.length < 6) {
    return response.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const { rows: existing } = await query('SELECT id FROM usuarios WHERE email = $1', [
    email.toLowerCase().trim(),
  ]);
  if (existing.length > 0) {
    return response.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
  }

  const senha_hash = await bcrypt.hash(senha, 10);
  await query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, especialidade, status, plano)
     VALUES ($1, $2, $3, 'profissional', $4, 'pendente', 'Básico')`,
    [nome.trim(), email.toLowerCase().trim(), senha_hash, especialidade || null]
  );

  return response
    .status(201)
    .json({ message: 'Conta criada com sucesso. Aguarde aprovação do administrador.' });
}

export async function esqueciSenha(request, response) {
  const { email } = request.body;
  if (!email) {
    return response.status(400).json({ message: 'E-mail é obrigatório.' });
  }

  const { rows } = await query(
    "SELECT id FROM usuarios WHERE email = $1 AND status = 'ativo'",
    [email.toLowerCase().trim()]
  );

  if (rows.length > 0) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await query(
      'INSERT INTO reset_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)',
      [rows[0].id, token, expires_at]
    );

    if (process.env.NODE_ENV !== 'production') {
      return response.json({
        message: 'Token gerado com sucesso.',
        token,
      });
    }
  }

  return response.json({
    message: 'Se o e-mail existir, você receberá as instruções em breve.',
  });
}

export async function redefinirSenha(request, response) {
  const { token, novaSenha } = request.body;
  if (!token || !novaSenha) {
    return response.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
  }
  if (novaSenha.length < 6) {
    return response.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const { rows } = await query(
    'SELECT * FROM reset_tokens WHERE token = $1 AND usado = FALSE AND expires_at > NOW()',
    [token]
  );
  if (rows.length === 0) {
    return response.status(400).json({ message: 'Token inválido ou expirado.' });
  }

  const senha_hash = await bcrypt.hash(novaSenha, 10);
  await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [
    senha_hash,
    rows[0].usuario_id,
  ]);
  await query('UPDATE reset_tokens SET usado = TRUE WHERE id = $1', [rows[0].id]);

  return response.json({ message: 'Senha redefinida com sucesso.' });
}
