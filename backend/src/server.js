import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();

const app    = express();
const PORT   = process.env.PORT || 3333;
const SECRET = process.env.JWT_SECRET || 'atende-plus-secret-dev';

/* ─── CORS ─────────────────────────────── */
const allowedOrigins = [
  'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('CORS bloqueado'))),
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

/* ─── ARMAZENAMENTO EM MEMÓRIA ──────────── */
const ADMIN_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'adm123', 10);

let usuarios = [{
  id: 1,
  nome:         process.env.ADMIN_NOME     || 'Wesley Melo',
  email:        (process.env.ADMIN_EMAIL   || 'developerwesleymelo@gmail.com').toLowerCase(),
  senha_hash:   ADMIN_HASH,
  perfil:       'admin',
  especialidade:'Administrador',
  sexo:         'Masculino',
  profissao:    'Administrador',
  conselho:     '',
  telefone:     '',
  status:       'ativo',
  plano:        'Admin',
  ultimo_acesso: null,
  created_at:   new Date('2024-01-01'),
}];

let atendimentos        = [];
let despesas            = [];
let pacientes           = [];
let resetTokens         = [];
let codigosVerificacao  = [];  // pending registrations
let notificacoes        = [];  // notifs para usuários (enviadas pelo admin)
let adminNotificacoes   = [];  // notifs do sistema para o admin
let relatorios          = [];  // histórico de relatórios gerados
let adminConfig = {
  notificacoesEmail:    true,
  aprovacaoAutomatica:  false,
  sessaoTimeout:        30,
  registroAcoes:        true,
  fusoHorario:          'America/Sao_Paulo',
  idioma:               'pt-BR',
};

let nextId = 100;
function uid() { return ++nextId; }

/* ─── HELPERS ───────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function formatUser(u) {
  const ats = atendimentos.filter(a => a.usuario_id === u.id);
  return {
    id:                 u.id,
    nome:               u.nome,
    email:              u.email,
    perfil:             u.perfil,
    especialidade:      u.especialidade || '',
    sexo:               u.sexo || 'Não informar',
    profissao:          u.profissao || u.especialidade || '',
    conselho:           u.conselho || '',
    telefone:           u.telefone || '',
    status:             u.status,
    plano:              u.plano,
    ultimoAcesso:       u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : '—',
    totalAtendimentos:  ats.length,
    totalFaturamento:   fmt(ats.filter(a => a.recebimento === 'recebido').reduce((s, a) => s + a.valorNum, 0)),
    criadoEm:           new Date(u.created_at).toISOString().slice(0, 10),
  };
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function parseDate(val) {
  if (!val) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/');
    return `${y}-${m}-${d}`;
  }
  return val;
}

function fmtAtendimento(a) {
  return {
    id: a.id, data: fmtDate(a.data), hora: a.hora || '—',
    paciente: a.paciente, pagador: a.pagador,
    cpfPaciente: a.cpfPaciente, cpfPagador: a.cpfPagador,
    valorNum: a.valorNum, valor: fmt(a.valorNum),
    situacao: a.situacao, recebimento: a.recebimento,
    documentacao: a.documentacao, nfStatus: a.nfStatus,
    receitaSaude: a.receitaSaude, servico: a.servico,
    formaPagamento: a.formaPagamento, precisaDoc: a.precisaDoc,
    observacoes: a.observacoes || '',
  };
}

function fmtDespesa(d) {
  return {
    id: d.id, data: fmtDate(d.data), descricao: d.descricao,
    categoria: d.categoria, valorNum: d.valorNum, valor: fmt(d.valorNum),
    formaPagamento: d.formaPagamento,
    comprovante: Boolean(d.comprovanteUrl),
    comprovanteUrl: d.comprovanteUrl || null,
  };
}

function fmtCpf(c) {
  const d = (c || '').replace(/\D/g, '');
  return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c;
}

function fmtPaciente(p) {
  const ultimo = atendimentos
    .filter(a => a.usuario_id === p.usuario_id && a.cpfPaciente === p.cpf)
    .map(a => a.data).sort().reverse()[0];
  return { id: p.id, nome: p.nome, cpf: fmtCpf(p.cpf), telefone: p.telefone || '', email: p.email || '', ultimoAtendimento: fmtDate(ultimo) };
}

function fmtNotif(n) {
  return {
    id: n.id, texto: n.texto, tipo: n.tipo, lida: n.lida,
    tempo: tempoRelativo(n.created_at),
    created_at: n.created_at,
  };
}

function tempoRelativo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)   return 'agora';
  if (min < 60)  return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h} hora${h > 1 ? 's' : ''} atrás`;
  return `${Math.floor(h / 24)} dia${Math.floor(h / 24) > 1 ? 's' : ''} atrás`;
}

function addAdminNotif(texto, tipo = 'sistema') {
  adminNotificacoes.unshift({ id: uid(), texto, tipo, lida: false, created_at: new Date() });
}

function addUserNotif(usuario_id, texto, tipo = 'admin') {
  const userId = Number(usuario_id);
  const existente = notificacoes.find(n => n.usuario_id === userId && n.texto === texto && !n.lida);
  if (existente) return existente;

  const nova = { id: uid(), usuario_id: userId, texto, tipo, lida: false, created_at: new Date() };
  notificacoes.unshift(nova);
  return nova;
}

function compactUserNotifs(usuario_id) {
  const userId = Number(usuario_id);
  const seen = new Set();
  notificacoes = notificacoes.filter(n => {
    if (n.usuario_id !== userId) return true;
    if (n.lida) return true;
    if (seen.has(n.texto)) return false;
    seen.add(n.texto);
    return true;
  });
}

/* ─── MIDDLEWARE JWT ────────────────────── */
function autenticar(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Token necessário.' });
  try {
    req.user = jwt.verify(h.slice(7), SECRET);

    // Impersonação: admin pode agir como outro usuário via header
    const impersonateId = req.headers['x-impersonate-id'];
    if (impersonateId && req.user.perfil === 'admin') {
      const alvo = usuarios.find(u => u.id === Number(impersonateId));
      if (alvo) req.user = { ...req.user, id: Number(impersonateId), _impersonando: true };
    }

    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

function apenasAdmin(req, res, next) {
  // Permite acesso se o JWT original é de admin (mesmo quando impersonando)
  const h = req.headers.authorization;
  try {
    const payload = jwt.verify(h?.slice(7) || '', SECRET);
    if (payload.perfil !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    next();
  } catch {
    res.status(403).json({ message: 'Acesso restrito a administradores.' });
  }
}

/* ═══════════════════════════════════════════
   AUTH
═══════════════════════════════════════════ */
app.get('/health', (_, res) => res.json({ status: 'ok', mode: 'memory' }));

/* Login */
app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });

  const u = usuarios.find(x => x.email === email.toLowerCase().trim());
  if (!u)                    return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
  if (u.status === 'pendente') return res.status(403).json({ message: 'Conta aguardando aprovação do administrador.' });
  if (u.status === 'inativo')  return res.status(403).json({ message: 'Conta desativada. Entre em contato com o administrador.' });

  const ok = await bcrypt.compare(senha, u.senha_hash);
  if (!ok) return res.status(401).json({ message: 'E-mail ou senha incorretos.' });

  u.ultimo_acesso = new Date();
  const token = jwt.sign({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: formatUser(u) });
});

/* Cadastro local direto: cria conta pendente para aprovação do admin */
app.post('/auth/registrar', async (req, res) => {
  const { nome, email, senha, especialidade, sexo } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  if (senha.length < 6) return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' });

  const emailNorm = email.toLowerCase().trim();
  if (usuarios.find(x => x.email === emailNorm)) {
    return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
  }
  codigosVerificacao = codigosVerificacao.filter(c => c.email !== emailNorm);

  const senha_hash = await bcrypt.hash(senha, 10);
  const novo = {
    id: uid(), nome: nome.trim(), email: emailNorm, senha_hash,
    perfil: 'profissional', especialidade: especialidade || '',
    sexo: sexo || 'Não informar', profissao: especialidade || '',
    conselho: '', telefone: '',
    status: 'pendente', plano: 'Básico',
    ultimo_acesso: null, created_at: new Date(),
  };
  usuarios.push(novo);

  addAdminNotif(`${nome} aguarda aprovação de cadastro.`, 'pendente');

  res.status(201).json({ message: 'Conta criada! Aguarde aprovação do administrador.' });
});

/* Etapa 1 do cadastro: valida dados e envia código */
app.post('/auth/enviar-codigo', async (req, res) => {
  const { nome, email, senha, especialidade, sexo } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  if (senha.length < 6) return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' });

  const emailNorm = email.toLowerCase().trim();
  if (usuarios.find(x => x.email === emailNorm))
    return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });

  // Remove código anterior se existir
  codigosVerificacao = codigosVerificacao.filter(c => c.email !== emailNorm);

  const codigo  = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 15 * 60 * 1000; // 15 min
  codigosVerificacao.push({ email: emailNorm, codigo, expires, dados: { nome, senha, especialidade, sexo } });

  // Em produção: enviar e-mail com o código
  res.json({ message: 'Código enviado para o e-mail.', ...(process.env.NODE_ENV !== 'production' && { codigo }) });
});

/* Etapa 2: verifica código e cria conta */
app.post('/auth/verificar-codigo', async (req, res) => {
  const { email, codigo } = req.body;
  const emailNorm = (email || '').toLowerCase().trim();

  const registro = codigosVerificacao.find(c => c.email === emailNorm && !c.usado);
  if (!registro) return res.status(400).json({ message: 'Código expirado ou não encontrado. Solicite um novo.' });
  if (Date.now() > registro.expires) return res.status(400).json({ message: 'Código expirado. Solicite um novo.' });
  if (registro.codigo !== codigo) return res.status(400).json({ message: 'Código incorreto.' });

  registro.usado = true;

  const { nome, senha, especialidade, sexo } = registro.dados;
  const senha_hash = await bcrypt.hash(senha, 10);
  const novo = {
    id: uid(), nome: nome.trim(), email: emailNorm, senha_hash,
    perfil: 'profissional', especialidade: especialidade || '',
    sexo: sexo || 'Não informar', profissao: especialidade || '',
    conselho: '', telefone: '',
    status: 'pendente', plano: 'Básico',
    ultimo_acesso: null, created_at: new Date(),
  };
  usuarios.push(novo);

  // Notificação automática para o admin
  addAdminNotif(`${nome} aguarda aprovação de cadastro.`, 'pendente');

  res.status(201).json({ message: 'Conta criada! Aguarde aprovação do administrador.' });
});

/* Reenviar código */
app.post('/auth/reenviar-codigo', (req, res) => {
  const emailNorm = (req.body.email || '').toLowerCase().trim();
  const registro  = codigosVerificacao.find(c => c.email === emailNorm && !c.usado);
  if (!registro) return res.status(400).json({ message: 'Solicitação não encontrada. Tente o cadastro novamente.' });

  const codigo  = String(Math.floor(100000 + Math.random() * 900000));
  registro.codigo  = codigo;
  registro.expires = Date.now() + 15 * 60 * 1000;

  res.json({ message: 'Novo código enviado.', ...(process.env.NODE_ENV !== 'production' && { codigo }) });
});

/* Esqueci senha */
app.post('/auth/esqueci-senha', (req, res) => {
  const emailNorm = (req.body.email || '').toLowerCase().trim();
  const u = usuarios.find(x => x.email === emailNorm && x.status === 'ativo');
  if (u) {
    const token   = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expires = Date.now() + 30 * 60 * 1000;
    resetTokens.push({ token, usuario_id: u.id, expires, usado: false });
    if (process.env.NODE_ENV !== 'production') return res.json({ message: 'Token gerado.', token });
  }
  res.json({ message: 'Se o e-mail existir, você receberá as instruções em breve.' });
});

/* Redefinir senha */
app.post('/auth/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;
  const rt = resetTokens.find(t => t.token === token && !t.usado && t.expires > Date.now());
  if (!rt) return res.status(400).json({ message: 'Token inválido ou expirado.' });
  const u = usuarios.find(x => x.id === rt.usuario_id);
  if (!u)  return res.status(400).json({ message: 'Usuário não encontrado.' });
  u.senha_hash = await bcrypt.hash(novaSenha, 10);
  rt.usado     = true;
  res.json({ message: 'Senha redefinida com sucesso.' });
});

/* Meu perfil */
app.get('/auth/me', autenticar, (req, res) => {
  const u = usuarios.find(x => x.id === req.user.id);
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json(formatUser(u));
});

/* Atualizar perfil */
app.put('/auth/me', autenticar, (req, res) => {
  const u = usuarios.find(x => x.id === req.user.id);
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
  const { nome, sexo, profissao, conselho, telefone } = req.body;
  if (nome)      u.nome      = nome.trim();
  if (sexo)      u.sexo      = sexo;
  if (profissao) u.profissao = profissao;
  if (conselho !== undefined) u.conselho  = conselho;
  if (telefone !== undefined) u.telefone  = telefone;
  res.json(formatUser(u));
});

/* Alterar senha */
app.put('/auth/senha', autenticar, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
  if (novaSenha.length < 6) return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres.' });

  const u = usuarios.find(x => x.id === req.user.id);
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });

  const ok = await bcrypt.compare(senhaAtual, u.senha_hash);
  if (!ok) return res.status(401).json({ message: 'Senha atual incorreta.' });

  u.senha_hash = await bcrypt.hash(novaSenha, 10);
  res.json({ message: 'Senha alterada com sucesso.' });
});

/* ═══════════════════════════════════════════
   ATENDIMENTOS
═══════════════════════════════════════════ */
app.get('/atendimentos', autenticar, (req, res) => {
  res.json(atendimentos.filter(a => a.usuario_id === req.user.id).map(fmtAtendimento));
});

app.post('/atendimentos', autenticar, (req, res) => {
  const b = req.body;
  const novo = {
    id: uid(), usuario_id: req.user.id,
    data:           parseDate(b.data || b.dataAtendimento),
    hora:           b.hora || null,
    paciente:       b.paciente || b.pacienteNome,
    pagador:        b.pagador  || b.pagadorNome,
    cpfPaciente:    (b.cpfPaciente || b.pacienteCpf || '').replace(/\D/g, ''),
    cpfPagador:     (b.cpfPagador  || b.pagadorDoc  || '').replace(/\D/g, ''),
    valorNum:       b.valorNum || 0,
    situacao:       b.situacao       || 'concluido',
    recebimento:    b.recebimento    || 'recebido',
    documentacao:   b.documentacao   || 'pendente',
    nfStatus:       b.nfStatus       || 'pendente',
    receitaSaude:   b.receitaSaude   || 'pronto',
    servico:        b.servico        || 'Consulta',
    formaPagamento: b.formaPagamento || 'PIX',
    precisaDoc:     b.precisaDoc ?? false,
    observacoes:    b.observacoes || '',
  };
  atendimentos.unshift(novo);
  res.status(201).json(fmtAtendimento(novo));
});

app.put('/atendimentos/:id', autenticar, (req, res) => {
  const idx = atendimentos.findIndex(a => a.id === Number(req.params.id) && a.usuario_id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Atendimento não encontrado.' });
  const b = req.body;
  atendimentos[idx] = {
    ...atendimentos[idx],
    data:           parseDate(b.data || b.dataAtendimento),
    hora:           b.hora || null,
    paciente:       b.paciente || b.pacienteNome,
    pagador:        b.pagador  || b.pagadorNome,
    cpfPaciente:    (b.cpfPaciente || b.pacienteCpf || '').replace(/\D/g, ''),
    cpfPagador:     (b.cpfPagador  || b.pagadorDoc  || '').replace(/\D/g, ''),
    valorNum:       b.valorNum ?? atendimentos[idx].valorNum,
    situacao:       b.situacao, recebimento: b.recebimento,
    documentacao:   b.documentacao, nfStatus: b.nfStatus,
    receitaSaude:   b.receitaSaude, servico: b.servico,
    formaPagamento: b.formaPagamento,
    precisaDoc:     b.precisaDoc ?? false,
    observacoes:    b.observacoes || '',
  };
  res.json(fmtAtendimento(atendimentos[idx]));
});

app.delete('/atendimentos/:id', autenticar, (req, res) => {
  const len = atendimentos.length;
  atendimentos = atendimentos.filter(a => !(a.id === Number(req.params.id) && a.usuario_id === req.user.id));
  if (atendimentos.length === len) return res.status(404).json({ message: 'Não encontrado.' });
  res.status(204).send();
});

/* ═══════════════════════════════════════════
   DESPESAS
═══════════════════════════════════════════ */
app.get('/despesas', autenticar, (req, res) => {
  res.json(despesas.filter(d => d.usuario_id === req.user.id).map(fmtDespesa));
});

app.post('/despesas', autenticar, (req, res) => {
  const b = req.body;
  const nova = {
    id: uid(), usuario_id: req.user.id,
    data: parseDate(b.data), descricao: b.descricao, categoria: b.categoria,
    valorNum: b.valorNum || 0, formaPagamento: b.formaPagamento,
    comprovanteUrl: b.comprovanteUrl || null,
  };
  despesas.unshift(nova);
  res.status(201).json(fmtDespesa(nova));
});

app.put('/despesas/:id', autenticar, (req, res) => {
  const idx = despesas.findIndex(d => d.id === Number(req.params.id) && d.usuario_id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Despesa não encontrada.' });
  const b = req.body;
  despesas[idx] = { ...despesas[idx], data: parseDate(b.data), descricao: b.descricao, categoria: b.categoria, valorNum: b.valorNum, formaPagamento: b.formaPagamento, comprovanteUrl: b.comprovanteUrl || null };
  res.json(fmtDespesa(despesas[idx]));
});

app.delete('/despesas/:id', autenticar, (req, res) => {
  const len = despesas.length;
  despesas = despesas.filter(d => !(d.id === Number(req.params.id) && d.usuario_id === req.user.id));
  if (despesas.length === len) return res.status(404).json({ message: 'Não encontrada.' });
  res.status(204).send();
});

/* ═══════════════════════════════════════════
   PACIENTES
═══════════════════════════════════════════ */
app.get('/pacientes', autenticar, (req, res) => {
  res.json(pacientes.filter(p => p.usuario_id === req.user.id).map(p => fmtPaciente(p)));
});

app.post('/pacientes', autenticar, (req, res) => {
  const b   = req.body;
  const cpf = (b.cpf || '').replace(/\D/g, '');
  if (pacientes.find(p => p.usuario_id === req.user.id && p.cpf === cpf))
    return res.status(409).json({ message: 'Já existe um paciente com este CPF.' });
  const novo = { id: uid(), usuario_id: req.user.id, nome: b.nome, cpf, telefone: b.telefone || '', email: b.email || '' };
  pacientes.push(novo);
  res.status(201).json(fmtPaciente(novo));
});

app.put('/pacientes/:id', autenticar, (req, res) => {
  const idx = pacientes.findIndex(p => p.id === Number(req.params.id) && p.usuario_id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Paciente não encontrado.' });
  const b = req.body;
  pacientes[idx] = { ...pacientes[idx], nome: b.nome, cpf: (b.cpf || '').replace(/\D/g, ''), telefone: b.telefone || '', email: b.email || '' };
  res.json(fmtPaciente(pacientes[idx]));
});

app.delete('/pacientes/:id', autenticar, (req, res) => {
  const len = pacientes.length;
  pacientes = pacientes.filter(p => !(p.id === Number(req.params.id) && p.usuario_id === req.user.id));
  if (pacientes.length === len) return res.status(404).json({ message: 'Não encontrado.' });
  res.status(204).send();
});

/* ═══════════════════════════════════════════
   NOTIFICAÇÕES (usuário)
═══════════════════════════════════════════ */
app.get('/notificacoes', autenticar, (req, res) => {
  compactUserNotifs(req.user.id);
  const minhas = notificacoes.filter(n => n.usuario_id === req.user.id);
  res.json(minhas.map(fmtNotif));
});

app.patch('/notificacoes/lidas', autenticar, (req, res) => {
  notificacoes.forEach(n => { if (n.usuario_id === req.user.id) n.lida = true; });
  res.json({ message: 'Marcadas como lidas.' });
});

app.patch('/notificacoes/:id/lida', autenticar, (req, res) => {
  const n = notificacoes.find(x => x.id === Number(req.params.id) && x.usuario_id === req.user.id);
  if (!n) return res.status(404).json({ message: 'Notificação não encontrada.' });
  n.lida = true;
  res.json(fmtNotif(n));
});

app.delete('/notificacoes/:id', autenticar, (req, res) => {
  const len = notificacoes.length;
  notificacoes = notificacoes.filter(n => !(n.id === Number(req.params.id) && n.usuario_id === req.user.id));
  if (notificacoes.length === len) return res.status(404).json({ message: 'Não encontrada.' });
  res.status(204).send();
});

/* ═══════════════════════════════════════════
   RELATÓRIOS (histórico)
═══════════════════════════════════════════ */
app.get('/relatorios', autenticar, (req, res) => {
  res.json(relatorios.filter(r => r.usuario_id === req.user.id));
});

app.post('/relatorios', autenticar, (req, res) => {
  const b = req.body;
  const novo = {
    id:        uid(),
    usuario_id: req.user.id,
    nome:      b.nome,
    tipo:      b.tipo,
    periodo:   b.periodo,
    formato:   b.formato || 'PDF',
    geradoEm:  new Date().toLocaleString('pt-BR').replace(',', ' às'),
  };
  relatorios.unshift(novo);
  res.status(201).json(novo);
});

app.delete('/relatorios/:id', autenticar, (req, res) => {
  const len = relatorios.length;
  relatorios = relatorios.filter(r => !(r.id === Number(req.params.id) && r.usuario_id === req.user.id));
  if (relatorios.length === len) return res.status(404).json({ message: 'Não encontrado.' });
  res.status(204).send();
});

/* ═══════════════════════════════════════════
   ADMIN — PROFISSIONAIS
═══════════════════════════════════════════ */
app.get('/admin/profissionais', autenticar, apenasAdmin, (_, res) => {
  res.json(usuarios.filter(u => u.perfil === 'profissional').map(formatUser));
});

app.get('/admin/profissionais/:id/atendimentos', autenticar, apenasAdmin, (req, res) => {
  res.json(atendimentos.filter(a => a.usuario_id === Number(req.params.id)).map(fmtAtendimento));
});

app.patch('/admin/profissionais/:id/aprovar', autenticar, apenasAdmin, (req, res) => {
  const u = usuarios.find(x => x.id === Number(req.params.id) && x.perfil === 'profissional');
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
  u.status = 'ativo';
  addUserNotif(u.id, 'Seu cadastro foi aprovado! Bem-vindo ao Atende+. Faça login para começar.', 'sistema');
  res.json({ message: 'Aprovado com sucesso.' });
});

app.patch('/admin/profissionais/:id/rejeitar', autenticar, apenasAdmin, (req, res) => {
  const u = usuarios.find(x => x.id === Number(req.params.id) && x.perfil === 'profissional');
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
  u.status = 'inativo';
  addUserNotif(u.id, 'Seu cadastro foi recusado. Entre em contato com o administrador para mais informações.', 'sistema');
  res.json({ message: 'Rejeitado.' });
});

app.patch('/admin/profissionais/:id/desativar', autenticar, apenasAdmin, (req, res) => {
  const u = usuarios.find(x => x.id === Number(req.params.id) && x.perfil === 'profissional');
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
  u.status = 'inativo';
  addUserNotif(u.id, 'Sua conta foi desativada. Entre em contato com o administrador.', 'sistema');
  res.json({ message: 'Desativado.' });
});

app.patch('/admin/profissionais/:id/reativar', autenticar, apenasAdmin, (req, res) => {
  const u = usuarios.find(x => x.id === Number(req.params.id) && x.perfil === 'profissional');
  if (!u) return res.status(404).json({ message: 'Usuário não encontrado.' });
  u.status = 'ativo';
  addUserNotif(u.id, 'Sua conta foi reativada. Você já pode acessar o sistema normalmente.', 'sistema');
  res.json({ message: 'Reativado.' });
});

/* ═══════════════════════════════════════════
   ADMIN — NOTIFICAÇÕES DO SISTEMA
═══════════════════════════════════════════ */
app.get('/admin/notificacoes', autenticar, apenasAdmin, (_, res) => {
  res.json(adminNotificacoes.map(fmtNotif));
});

app.patch('/admin/notificacoes/lidas', autenticar, apenasAdmin, (_, res) => {
  adminNotificacoes.forEach(n => { n.lida = true; });
  res.json({ message: 'Marcadas como lidas.' });
});

app.patch('/admin/notificacoes/:id/lida', autenticar, apenasAdmin, (req, res) => {
  const n = adminNotificacoes.find(x => x.id === Number(req.params.id));
  if (!n) return res.status(404).json({ message: 'Não encontrada.' });
  n.lida = true;
  res.json(fmtNotif(n));
});

/* Admin envia notificação para usuário(s) */
app.post('/admin/notificacoes', autenticar, apenasAdmin, (req, res) => {
  const { userIds, texto } = req.body;
  if (!Array.isArray(userIds) || !texto) return res.status(400).json({ message: 'userIds e texto são obrigatórios.' });
  userIds.forEach(uid => addUserNotif(uid, texto, 'admin'));
  res.status(201).json({ message: `Notificação enviada para ${userIds.length} usuário(s).` });
});

/* ═══════════════════════════════════════════
   ADMIN — CONFIGURAÇÕES DO SISTEMA
═══════════════════════════════════════════ */
app.get('/admin/configuracoes', autenticar, apenasAdmin, (_, res) => {
  res.json(adminConfig);
});

app.put('/admin/configuracoes', autenticar, apenasAdmin, (req, res) => {
  adminConfig = { ...adminConfig, ...req.body };
  res.json(adminConfig);
});

/* ═══════════════════════════════════════════
   ADMIN — EXPORTAR CSV
═══════════════════════════════════════════ */
app.get('/admin/exportar', autenticar, apenasAdmin, (req, res) => {
  const { usuario_id } = req.query;
  let data = [...atendimentos];
  if (usuario_id) data = data.filter(a => a.usuario_id === Number(usuario_id));
  const header = 'data;profissional;paciente;pagador;cpf_pagador;valor;forma_pagamento;nf_status';
  const rows   = data.map(a => {
    const u = usuarios.find(x => x.id === a.usuario_id);
    return [fmtDate(a.data), u?.nome || '', a.paciente, a.pagador, a.cpfPagador, a.valorNum, a.formaPagamento, a.nfStatus].join(';');
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="atendimentos.csv"');
  res.send([header, ...rows].join('\n'));
});

/* ─── ERROR HANDLER ──────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Erro interno no servidor.' });
});

app.listen(PORT, () => {
  console.log(`\nAtende+ API (memória) → porta ${PORT}`);
  console.log(`Admin: ${process.env.ADMIN_EMAIL || 'developerwesleymelo@gmail.com'} / ${process.env.ADMIN_PASSWORD || 'adm123'}\n`);
});
