import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from './database/connection.js';
import { enviarCodigoVerificacao, enviarRedefinicaoSenha } from './email.js';

dotenv.config();

const app    = express();
const PORT   = process.env.PORT   || 3333;
const SECRET = process.env.JWT_SECRET || 'atende-plus-secret-dev';

/* ─── CORS ──────────────────────────────────── */
const allowedOrigins = [
  'http://localhost:5173','http://localhost:5174','http://localhost:3000',
  'https://atendemais.tech','https://www.atendemais.tech',
  'https://atende-mais-vers-o-final.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({ origin: (o, cb) => (!o || allowedOrigins.some(a => o === a || o.endsWith('.vercel.app')) ? cb(null,true) : cb(new Error('CORS bloqueado'))), credentials: true }));
app.use(express.json({ limit: '5mb' }));

/* ─── MEMÓRIA (apenas dados temporários) ─────── */
let codigosVerificacao = [];
let adminNotificacoes  = [];
let adminConfig = { notificacoesEmail:true, aprovacaoAutomatica:false, sessaoTimeout:30, registroAcoes:true, fusoHorario:'America/Sao_Paulo', idioma:'pt-BR' };

/* ─── HELPERS ────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);

function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
}

function parseDate(val) {
  if (!val) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) { const [d,m,y]=val.split('/'); return `${y}-${m}-${d}`; }
  return val;
}

function tempoRelativo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const min  = Math.floor(diff/60000);
  if (min<1)  return 'agora';
  if (min<60) return `${min} min atrás`;
  const h = Math.floor(min/60);
  if (h<24)   return `${h} hora${h>1?'s':''} atrás`;
  return `${Math.floor(h/24)} dia${Math.floor(h/24)>1?'s':''} atrás`;
}

function fmtUser(u, totalAtendimentos=0, totalFaturamento=0) {
  return {
    id: Number(u.id), nome: u.nome, email: u.email,
    perfil: u.perfil, especialidade: u.especialidade||'',
    sexo: u.sexo||'Não informar', profissao: u.profissao||u.especialidade||'',
    conselho: u.conselho||'', telefone: u.telefone||'',
    status: u.status, plano: u.plano,
    ultimoAcesso: u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : '—',
    totalAtendimentos, totalFaturamento: fmt(totalFaturamento),
    criadoEm: u.created_at ? new Date(u.created_at).toISOString().slice(0,10) : '',
  };
}

function fmtAtendimento(a) {
  return {
    id: Number(a.id), data: fmtDate(a.data), hora: a.hora||'—',
    paciente: a.paciente, pagador: a.pagador,
    cpfPaciente: a.cpf_paciente||a.cpfPaciente||'',
    cpfPagador:  a.cpf_pagador ||a.cpfPagador ||'',
    valorNum: Number(a.valor_num||a.valorNum||0),
    valor: fmt(Number(a.valor_num||a.valorNum||0)),
    situacao: a.situacao, recebimento: a.recebimento,
    documentacao: a.documentacao, nfStatus: a.nf_status||a.nfStatus||'pendente',
    receitaSaude: a.receita_saude||a.receitaSaude||'pronto',
    servico: a.servico, formaPagamento: a.forma_pagamento||a.formaPagamento||'PIX',
    precisaDoc: Boolean(a.precisa_doc||a.precisaDoc),
    pacienteTelefone: a.paciente_telefone||'',
    pacienteEmail: a.paciente_email||'',
    observacoes: a.observacoes||'',
  };
}

function fmtDespesa(d) {
  const url = d.comprovante_url||d.comprovanteUrl||null;
  let arquivos = null;
  if (url && url !== 'legacy') {
    try { arquivos = JSON.parse(url); } catch { arquivos = null; }
  }
  return {
    id: Number(d.id), data: fmtDate(d.data), descricao: d.descricao,
    categoria: d.categoria,
    valorNum: Number(d.valor_num||d.valorNum||0),
    valor: fmt(Number(d.valor_num||d.valorNum||0)),
    formaPagamento: d.forma_pagamento||d.formaPagamento||'',
    comprovante: Boolean(url),
    comprovanteUrl: url,
    arquivos,
  };
}

function fmtCpf(c) {
  const d=(c||'').replace(/\D/g,'');
  return d.length===11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4') : c;
}

function fmtPaciente(p) {
  return {
    id: Number(p.id), nome: p.nome, cpf: fmtCpf(p.cpf),
    telefone: p.telefone||'', email: p.email||'',
    ultimoAtendimento: p.ultimo_atendimento ? fmtDate(p.ultimo_atendimento) : '—',
  };
}

function fmtNotif(n) {
  return { id:Number(n.id), texto:n.texto, tipo:n.tipo, lida:Boolean(n.lida), tempo:tempoRelativo(n.created_at) };
}

async function addUserNotif(usuario_id, texto, tipo='admin') {
  try {
    await query(
      'INSERT INTO notificacoes(usuario_id,texto,tipo) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM notificacoes WHERE usuario_id=$1 AND texto=$2 AND lida=false)',
      [Number(usuario_id), texto, tipo]
    );
  } catch(e) { console.error('addUserNotif:', e.message); }
}

function addAdminNotif(texto, tipo='sistema') {
  adminNotificacoes.unshift({ id: Date.now(), texto, tipo, lida:false, created_at: new Date() });
}

/* ─── MIDDLEWARE JWT ─────────────────────────── */
function autenticar(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message:'Token necessário.' });
  try {
    req.user = jwt.verify(h.slice(7), SECRET);
    const impId = req.headers['x-impersonate-id'];
    if (impId && req.user.perfil==='admin') req.user = { ...req.user, id:Number(impId), _impersonando:true };
    next();
  } catch { res.status(401).json({ message:'Token inválido ou expirado.' }); }
}

function apenasAdmin(req, res, next) {
  try {
    const p = jwt.verify((req.headers.authorization||'').slice(7), SECRET);
    if (p.perfil!=='admin') return res.status(403).json({ message:'Acesso restrito.' });
    next();
  } catch { res.status(403).json({ message:'Acesso restrito.' }); }
}

/* ════════════════════════════════════════════════
   AUTH
════════════════════════════════════════════════ */
app.get('/health', (_,res) => res.json({ status:'ok', mode:'postgresql' }));

app.post('/auth/login', async (req,res) => {
  try {
    const { email, senha } = req.body;
    if (!email||!senha) return res.status(400).json({ message:'E-mail e senha são obrigatórios.' });
    const { rows } = await query('SELECT * FROM usuarios WHERE email=$1',[email.toLowerCase().trim()]);
    const u = rows[0];
    if (!u)                    return res.status(401).json({ message:'E-mail ou senha incorretos.' });
    if (u.status==='pendente') return res.status(403).json({ message:'Conta aguardando aprovação do administrador.' });
    if (u.status==='inativo')  return res.status(403).json({ message:'Conta desativada. Entre em contato com o administrador.' });
    if (!await bcrypt.compare(senha, u.senha_hash)) return res.status(401).json({ message:'E-mail ou senha incorretos.' });
    await query('UPDATE usuarios SET ultimo_acesso=NOW() WHERE id=$1',[u.id]);
    const token = jwt.sign({ id:u.id, nome:u.nome, email:u.email, perfil:u.perfil, sexo:u.sexo }, SECRET, { expiresIn:'7d' });
    res.json({ token, user: fmtUser(u) });
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro interno.' }); }
});

app.post('/auth/registrar', async (req,res) => {
  try {
    const { nome, email, senha, especialidade, sexo } = req.body;
    if (!nome||!email||!senha) return res.status(400).json({ message:'Nome, e-mail e senha são obrigatórios.' });
    if (senha.length<6) return res.status(400).json({ message:'Senha deve ter pelo menos 6 caracteres.' });
    const emailNorm = email.toLowerCase().trim();
    const existe = await query('SELECT id FROM usuarios WHERE email=$1',[emailNorm]);
    if (existe.rows.length) return res.status(409).json({ message:'Já existe uma conta com este e-mail.' });
    const hash   = await bcrypt.hash(senha, 10);
    const status = adminConfig.aprovacaoAutomatica ? 'ativo' : 'pendente';
    await query(
      `INSERT INTO usuarios(nome,email,senha_hash,perfil,especialidade,sexo,profissao,status,plano)
       VALUES($1,$2,$3,'profissional',$4,$5,$4,$6,'Básico')`,
      [nome.trim(), emailNorm, hash, especialidade||'', sexo||'Não informar', status]
    );
    if (status === 'pendente') addAdminNotif(`${nome.trim()} aguarda aprovação de cadastro.`, 'pendente');
    const msg = status === 'ativo' ? 'Conta criada! Você já pode fazer login.' : 'Conta criada! Aguarde aprovação do administrador.';
    res.status(201).json({ message: msg });
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro ao criar conta.' }); }
});

app.post('/auth/enviar-codigo', async (req,res) => {
  try {
    const { nome, email, senha, especialidade, sexo, cpf } = req.body;
    if (!nome||!email||!senha) return res.status(400).json({ message:'Dados incompletos.' });
    if (!cpf || (cpf.replace(/\D/g,'').length !== 11 && cpf.replace(/\D/g,'').length !== 14))
      return res.status(400).json({ message:'CPF ou CNPJ inválido.' });
    const emailNorm = email.toLowerCase().trim();
    const cpfDigits = cpf.replace(/\D/g,'');
    const existe    = await query('SELECT id FROM usuarios WHERE email=$1',[emailNorm]);
    if (existe.rows.length) return res.status(409).json({ message:'Já existe uma conta com este e-mail.' });
    const existeCpf = await query('SELECT id FROM usuarios WHERE cpf=$1',[cpfDigits]);
    if (existeCpf.rows.length) return res.status(409).json({ message:'Já existe uma conta com este CPF/CNPJ.' });
    codigosVerificacao = codigosVerificacao.filter(c => c.email!==emailNorm);
    const codigo  = String(Math.floor(100000+Math.random()*900000));
    const expires = Date.now()+15*60*1000;
    codigosVerificacao.push({ email:emailNorm, codigo, expires, dados:{nome,senha,especialidade,sexo,cpf:cpfDigits} });
    try { await enviarCodigoVerificacao(emailNorm, nome, codigo); } catch(emailErr) { console.error('Erro e-mail:', emailErr.message); }
    res.json({ message:'Código enviado para o seu e-mail.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.post('/auth/verificar-codigo', async (req,res) => {
  try {
    const { email, codigo } = req.body;
    const emailNorm = (email||'').toLowerCase().trim();
    const reg = codigosVerificacao.find(c => c.email===emailNorm&&!c.usado);
    if (!reg||Date.now()>reg.expires) return res.status(400).json({ message:'Código expirado.' });
    if (reg.codigo!==codigo) return res.status(400).json({ message:'Código incorreto.' });
    reg.usado = true;
    const { nome, senha, especialidade, sexo, cpf } = reg.dados;
    const hash   = await bcrypt.hash(senha, 10);
    const status = adminConfig.aprovacaoAutomatica ? 'ativo' : 'pendente';
    await query(
      `INSERT INTO usuarios(nome,email,senha_hash,perfil,especialidade,sexo,profissao,cpf,status,plano)
       VALUES($1,$2,$3,'profissional',$4,$5,$4,$6,$7,'Básico')`,
      [nome.trim(), emailNorm, hash, especialidade||'', sexo||'Não informar', cpf||null, status]
    );
    if (status === 'pendente') addAdminNotif(`${nome.trim()} aguarda aprovação de cadastro.`, 'pendente');
    const msg = status === 'ativo' ? 'Conta criada! Você já pode fazer login.' : 'Conta criada! Aguarde aprovação do administrador.';
    res.status(201).json({ message: msg });
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro interno.' }); }
});

app.post('/auth/reenviar-codigo', async (req,res) => {
  const emailNorm = (req.body.email||'').toLowerCase().trim();
  const reg = codigosVerificacao.find(c => c.email===emailNorm&&!c.usado);
  if (!reg) return res.status(400).json({ message:'Solicitação não encontrada.' });
  reg.codigo  = String(Math.floor(100000+Math.random()*900000));
  reg.expires = Date.now()+15*60*1000;
  try { await enviarCodigoVerificacao(emailNorm, reg.dados?.nome||'', reg.codigo); } catch(e) { console.error('Erro ao reenviar e-mail:', e.message); }
  res.json({ message:'Novo código enviado para o seu e-mail.' });
});

app.post('/auth/esqueci-senha', async (req,res) => {
  try {
    const input     = (req.body.email||'').trim();
    const emailNorm = input.toLowerCase();
    const cpfDigits = input.replace(/\D/g,'');
    /* Busca por e-mail OU CPF */
    const { rows } = await query(
      "SELECT id, nome, email FROM usuarios WHERE (email=$1 OR (cpf=$2 AND $2 != '')) AND status='ativo'",
      [emailNorm, cpfDigits]
    );
    if (rows.length) {
      const token   = Math.random().toString(36).slice(2)+Date.now().toString(36);
      const expires = new Date(Date.now()+30*60*1000);
      await query('INSERT INTO reset_tokens(usuario_id,token,expires_at) VALUES($1,$2,$3)',[rows[0].id,token,expires]);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      const link = `${frontendUrl}/redefinir-senha?token=${token}`;
      try { await enviarRedefinicaoSenha(rows[0].email, rows[0].nome||'', link); } catch(e) { console.error('Erro ao enviar e-mail:', e.message); }
      if (process.env.NODE_ENV!=='production') return res.json({ message:'Link enviado.', token, email: rows[0].email });
    }
    res.json({ message:'Se o e-mail existir, você receberá as instruções em breve.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.post('/auth/redefinir-senha', async (req,res) => {
  try {
    const { token, novaSenha } = req.body;
    const { rows } = await query("SELECT * FROM reset_tokens WHERE token=$1 AND usado=false AND expires_at>NOW()",[token]);
    if (!rows.length) return res.status(400).json({ message:'Token inválido ou expirado.' });
    const hash = await bcrypt.hash(novaSenha, 10);
    await query('UPDATE usuarios SET senha_hash=$1 WHERE id=$2',[hash, rows[0].usuario_id]);
    await query('UPDATE reset_tokens SET usado=true WHERE id=$1',[rows[0].id]);
    res.json({ message:'Senha redefinida com sucesso.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.get('/auth/me', autenticar, async (req,res) => {
  try {
    const { rows } = await query('SELECT * FROM usuarios WHERE id=$1',[req.user.id]);
    if (!rows.length) return res.status(404).json({ message:'Usuário não encontrado.' });
    res.json(fmtUser(rows[0]));
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.put('/auth/me', autenticar, async (req,res) => {
  try {
    const { nome, sexo, profissao, conselho, telefone, email } = req.body;
    await query(
      `UPDATE usuarios SET
        nome=COALESCE(NULLIF($1,''),nome), sexo=COALESCE(NULLIF($2,''),sexo),
        profissao=COALESCE(NULLIF($3,''),profissao), conselho=COALESCE($4,conselho),
        telefone=COALESCE($5,telefone), email=COALESCE(NULLIF($6,''),email),
        updated_at=NOW() WHERE id=$7`,
      [nome||null, sexo||null, profissao||null, conselho??null, telefone??null, email||null, req.user.id]
    );
    const { rows } = await query('SELECT * FROM usuarios WHERE id=$1',[req.user.id]);
    res.json(fmtUser(rows[0]));
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro ao atualizar perfil.' }); }
});

app.put('/auth/senha', autenticar, async (req,res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual||!novaSenha) return res.status(400).json({ message:'Campos obrigatórios.' });
    if (novaSenha.length<6) return res.status(400).json({ message:'Nova senha: mínimo 6 caracteres.' });
    const { rows } = await query('SELECT senha_hash FROM usuarios WHERE id=$1',[req.user.id]);
    if (!rows.length||!await bcrypt.compare(senhaAtual,rows[0].senha_hash))
      return res.status(401).json({ message:'Senha atual incorreta.' });
    await query('UPDATE usuarios SET senha_hash=$1 WHERE id=$2',[await bcrypt.hash(novaSenha,10),req.user.id]);
    res.json({ message:'Senha alterada com sucesso.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

/* ════════════════════════════════════════════════
   ATENDIMENTOS
════════════════════════════════════════════════ */
app.get('/atendimentos', autenticar, async (req,res) => {
  try {
    const { rows } = await query('SELECT * FROM atendimentos WHERE usuario_id=$1 ORDER BY data DESC, created_at DESC',[req.user.id]);
    res.json(rows.map(fmtAtendimento));
  } catch(e) { res.status(500).json({ message:'Erro ao buscar atendimentos.' }); }
});

app.post('/atendimentos', autenticar, async (req,res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO atendimentos(usuario_id,data,hora,paciente,pagador,cpf_paciente,cpf_pagador,
        valor_num,situacao,recebimento,documentacao,nf_status,receita_saude,servico,
        forma_pagamento,precisa_doc,paciente_telefone,paciente_email,observacoes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [req.user.id, parseDate(b.data||b.dataAtendimento), b.hora||null,
       b.paciente||b.pacienteNome, b.pagador||b.pagadorNome,
       (b.cpfPaciente||b.pacienteCpf||'').replace(/\D/g,''),
       (b.cpfPagador||b.pagadorDoc||'').replace(/\D/g,''),
       b.valorNum||0,
       b.situacao||'concluido', b.recebimento||'recebido',
       b.documentacao||'pendente', b.nfStatus||'pendente',
       b.receitaSaude||'pronto', b.servico||'Consulta',
       b.formaPagamento||'PIX', b.precisaDoc??false,
       b.pacienteTelefone||null, b.pacienteEmail||null, b.observacoes||null]
    );
    res.status(201).json(fmtAtendimento(rows[0]));
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro ao criar atendimento.' }); }
});

app.put('/atendimentos/:id', autenticar, async (req,res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE atendimentos SET data=$1,hora=$2,paciente=$3,pagador=$4,cpf_paciente=$5,cpf_pagador=$6,
        valor_num=$7,situacao=$8,recebimento=$9,documentacao=$10,nf_status=$11,receita_saude=$12,
        servico=$13,forma_pagamento=$14,precisa_doc=$15,paciente_telefone=$16,paciente_email=$17,
        observacoes=$18,updated_at=NOW()
       WHERE id=$19 AND usuario_id=$20 RETURNING *`,
      [parseDate(b.data||b.dataAtendimento), b.hora||null,
       b.paciente||b.pacienteNome, b.pagador||b.pagadorNome,
       (b.cpfPaciente||b.pacienteCpf||'').replace(/\D/g,''),
       (b.cpfPagador||b.pagadorDoc||'').replace(/\D/g,''),
       b.valorNum||0,
       b.situacao||'concluido', b.recebimento||'recebido',
       b.documentacao||'pendente', b.nfStatus||'pendente',
       b.receitaSaude||'pronto', b.servico||'Consulta',
       b.formaPagamento||'PIX', b.precisaDoc??false,
       b.pacienteTelefone||null, b.pacienteEmail||null, b.observacoes||null,
       req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message:'Atendimento não encontrado.' });
    res.json(fmtAtendimento(rows[0]));
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro ao atualizar.' }); }
});

app.delete('/atendimentos/:id', autenticar, async (req,res) => {
  try {
    const { rowCount } = await query('DELETE FROM atendimentos WHERE id=$1 AND usuario_id=$2',[req.params.id,req.user.id]);
    if (!rowCount) return res.status(404).json({ message:'Não encontrado.' });
    res.status(204).send();
  } catch(e) { res.status(500).json({ message:'Erro ao excluir.' }); }
});

/* ════════════════════════════════════════════════
   DESPESAS
════════════════════════════════════════════════ */
app.get('/despesas', autenticar, async (req,res) => {
  try {
    const { rows } = await query('SELECT * FROM despesas WHERE usuario_id=$1 ORDER BY data DESC, created_at DESC',[req.user.id]);
    res.json(rows.map(fmtDespesa));
  } catch(e) { res.status(500).json({ message:'Erro ao buscar despesas.' }); }
});

app.post('/despesas', autenticar, async (req,res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO despesas(usuario_id,data,descricao,categoria,valor_num,forma_pagamento,comprovante_url)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, parseDate(b.data), b.descricao, b.categoria, b.valorNum||0, b.formaPagamento, b.comprovanteUrl||null]
    );
    res.status(201).json(fmtDespesa(rows[0]));
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro ao criar despesa.' }); }
});

app.put('/despesas/:id', autenticar, async (req,res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE despesas SET data=$1,descricao=$2,categoria=$3,valor_num=$4,forma_pagamento=$5,
        comprovante_url=$6,updated_at=NOW() WHERE id=$7 AND usuario_id=$8 RETURNING *`,
      [parseDate(b.data), b.descricao, b.categoria, b.valorNum||0, b.formaPagamento, b.comprovanteUrl||null, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message:'Despesa não encontrada.' });
    res.json(fmtDespesa(rows[0]));
  } catch(e) { res.status(500).json({ message:'Erro ao atualizar.' }); }
});

app.delete('/despesas/:id', autenticar, async (req,res) => {
  try {
    const { rowCount } = await query('DELETE FROM despesas WHERE id=$1 AND usuario_id=$2',[req.params.id,req.user.id]);
    if (!rowCount) return res.status(404).json({ message:'Não encontrada.' });
    res.status(204).send();
  } catch(e) { res.status(500).json({ message:'Erro ao excluir.' }); }
});

/* ════════════════════════════════════════════════
   PACIENTES
════════════════════════════════════════════════ */
app.get('/pacientes', autenticar, async (req,res) => {
  try {
    const { rows } = await query('SELECT * FROM pacientes WHERE usuario_id=$1 ORDER BY nome',[req.user.id]);
    res.json(rows.map(fmtPaciente));
  } catch(e) { res.status(500).json({ message:'Erro ao buscar pacientes.' }); }
});

app.post('/pacientes', autenticar, async (req,res) => {
  try {
    const b = req.body;
    const cpf = (b.cpf||'').replace(/\D/g,'');
    const { rows } = await query(
      `INSERT INTO pacientes(usuario_id,nome,cpf,telefone,email)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, b.nome, cpf, b.telefone||null, b.email||null]
    );
    res.status(201).json(fmtPaciente(rows[0]));
  } catch(e) {
    if (e.code==='23505') return res.status(409).json({ message:'Já existe um paciente com este CPF.' });
    console.error(e); res.status(500).json({ message:'Erro ao criar paciente.' });
  }
});

app.put('/pacientes/:id', autenticar, async (req,res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE pacientes SET nome=$1,cpf=$2,telefone=$3,email=$4,updated_at=NOW()
       WHERE id=$5 AND usuario_id=$6 RETURNING *`,
      [b.nome, (b.cpf||'').replace(/\D/g,''), b.telefone||null, b.email||null, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message:'Paciente não encontrado.' });
    res.json(fmtPaciente(rows[0]));
  } catch(e) { res.status(500).json({ message:'Erro ao atualizar.' }); }
});

app.delete('/pacientes/:id', autenticar, async (req,res) => {
  try {
    const { rowCount } = await query('DELETE FROM pacientes WHERE id=$1 AND usuario_id=$2',[req.params.id,req.user.id]);
    if (!rowCount) return res.status(404).json({ message:'Não encontrado.' });
    res.status(204).send();
  } catch(e) { res.status(500).json({ message:'Erro ao excluir.' }); }
});

/* ════════════════════════════════════════════════
   NOTIFICAÇÕES (usuário)
════════════════════════════════════════════════ */
app.get('/notificacoes', autenticar, async (req,res) => {
  try {
    const { rows } = await query('SELECT * FROM notificacoes WHERE usuario_id=$1 ORDER BY created_at DESC LIMIT 50',[req.user.id]);
    res.json(rows.map(fmtNotif));
  } catch(e) { res.status(500).json({ message:'Erro ao buscar notificações.' }); }
});

app.patch('/notificacoes/lidas', autenticar, async (req,res) => {
  try {
    await query('UPDATE notificacoes SET lida=true WHERE usuario_id=$1',[req.user.id]);
    res.json({ message:'Marcadas como lidas.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.patch('/notificacoes/:id/lida', autenticar, async (req,res) => {
  try {
    const { rows } = await query('UPDATE notificacoes SET lida=true WHERE id=$1 AND usuario_id=$2 RETURNING *',[req.params.id,req.user.id]);
    if (!rows.length) return res.status(404).json({ message:'Não encontrada.' });
    res.json(fmtNotif(rows[0]));
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.delete('/notificacoes/:id', autenticar, async (req,res) => {
  try {
    await query('DELETE FROM notificacoes WHERE id=$1 AND usuario_id=$2',[req.params.id,req.user.id]);
    res.status(204).send();
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

/* ════════════════════════════════════════════════
   ADMIN — PROFISSIONAIS
════════════════════════════════════════════════ */
app.get('/admin/profissionais', autenticar, apenasAdmin, async (_,res) => {
  try {
    const { rows } = await query("SELECT * FROM usuarios WHERE perfil='profissional' ORDER BY created_at DESC");
    const result = await Promise.all(rows.map(async u => {
      const { rows:ats } = await query("SELECT COUNT(*) as total, COALESCE(SUM(valor_num),0) as fat FROM atendimentos WHERE usuario_id=$1 AND recebimento='recebido'",[u.id]);
      return fmtUser(u, Number(ats[0].total), Number(ats[0].fat));
    }));
    res.json(result);
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro ao listar profissionais.' }); }
});

app.patch('/admin/profissionais/:id/aprovar', autenticar, apenasAdmin, async (req,res) => {
  try {
    const { rows } = await query("UPDATE usuarios SET status='ativo' WHERE id=$1 AND perfil='profissional' RETURNING nome",[req.params.id]);
    if (!rows.length) return res.status(404).json({ message:'Usuário não encontrado.' });
    await addUserNotif(req.params.id,'Seu cadastro foi aprovado! Bem-vindo ao Atende+. Faça login para começar.','sistema');
    res.json({ message:'Aprovado com sucesso.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.patch('/admin/profissionais/:id/rejeitar', autenticar, apenasAdmin, async (req,res) => {
  try {
    const { rows } = await query("UPDATE usuarios SET status='inativo' WHERE id=$1 AND perfil='profissional' RETURNING nome",[req.params.id]);
    if (!rows.length) return res.status(404).json({ message:'Usuário não encontrado.' });
    await addUserNotif(req.params.id,'Seu cadastro foi recusado. Entre em contato com o administrador.','sistema');
    res.json({ message:'Rejeitado.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.patch('/admin/profissionais/:id/desativar', autenticar, apenasAdmin, async (req,res) => {
  try {
    const { rows } = await query("UPDATE usuarios SET status='inativo' WHERE id=$1 AND perfil='profissional' RETURNING nome",[req.params.id]);
    if (!rows.length) return res.status(404).json({ message:'Usuário não encontrado.' });
    await addUserNotif(req.params.id,'Sua conta foi desativada. Entre em contato com o administrador.','sistema');
    res.json({ message:'Desativado.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

app.delete('/admin/profissionais/:id', autenticar, apenasAdmin, async (req,res) => {
  try {
    const { rowCount } = await query("DELETE FROM usuarios WHERE id=$1 AND perfil='profissional'",[req.params.id]);
    if (!rowCount) return res.status(404).json({ message:'Usuário não encontrado.' });
    res.json({ message:'Cadastro excluído. O usuário pode se cadastrar novamente.' });
  } catch(e) { console.error(e); res.status(500).json({ message:'Erro ao excluir.' }); }
});

app.patch('/admin/profissionais/:id/reativar', autenticar, apenasAdmin, async (req,res) => {
  try {
    const { rows } = await query("UPDATE usuarios SET status='ativo' WHERE id=$1 AND perfil='profissional' RETURNING nome",[req.params.id]);
    if (!rows.length) return res.status(404).json({ message:'Usuário não encontrado.' });
    await addUserNotif(req.params.id,'Sua conta foi reativada. Você já pode acessar o sistema normalmente.','sistema');
    res.json({ message:'Reativado.' });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

/* ════════════════════════════════════════════════
   ADMIN — NOTIFICAÇÕES
════════════════════════════════════════════════ */
app.get('/admin/notificacoes', autenticar, apenasAdmin, (_,res) => {
  res.json(adminNotificacoes.map(fmtNotif));
});

app.patch('/admin/notificacoes/lidas', autenticar, apenasAdmin, (_,res) => {
  adminNotificacoes.forEach(n => { n.lida=true; });
  res.json({ message:'Marcadas.' });
});

app.patch('/admin/notificacoes/:id/lida', autenticar, apenasAdmin, (req,res) => {
  const n = adminNotificacoes.find(x => x.id===Number(req.params.id));
  if (!n) return res.status(404).json({ message:'Não encontrada.' });
  n.lida = true;
  res.json(fmtNotif(n));
});

app.post('/admin/notificacoes', autenticar, apenasAdmin, async (req,res) => {
  try {
    const { userIds, texto } = req.body;
    if (!Array.isArray(userIds)||!texto) return res.status(400).json({ message:'userIds e texto são obrigatórios.' });
    await Promise.all(userIds.map(id => addUserNotif(id,texto,'admin')));
    res.status(201).json({ message:`Notificação enviada para ${userIds.length} usuário(s).` });
  } catch(e) { res.status(500).json({ message:'Erro interno.' }); }
});

/* ════════════════════════════════════════════════
   RELATÓRIOS (histórico em memória por sessão)
════════════════════════════════════════════════ */
const relatoriosMap = {}; // userId → []

app.get('/relatorios', autenticar, (req,res) => {
  res.json(relatoriosMap[req.user.id] || []);
});

app.post('/relatorios', autenticar, (req,res) => {
  const b = req.body;
  const novo = {
    id: Date.now(), usuario_id: req.user.id,
    nome: b.nome, tipo: b.tipo, periodo: b.periodo,
    formato: b.formato || 'PDF',
    geradoEm: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às'),
  };
  if (!relatoriosMap[req.user.id]) relatoriosMap[req.user.id] = [];
  relatoriosMap[req.user.id].unshift(novo);
  res.status(201).json(novo);
});

app.delete('/relatorios/:id', autenticar, (req,res) => {
  const uid = req.user.id;
  if (relatoriosMap[uid])
    relatoriosMap[uid] = relatoriosMap[uid].filter(r => r.id !== Number(req.params.id));
  res.status(204).send();
});

/* ════════════════════════════════════════════════
   ADMIN — CONFIGURAÇÕES
════════════════════════════════════════════════ */
app.get('/admin/configuracoes',  autenticar, apenasAdmin, (_,res) => res.json(adminConfig));
app.put('/admin/configuracoes',  autenticar, apenasAdmin, (req,res) => { adminConfig={...adminConfig,...req.body}; res.json(adminConfig); });

/* ─── ERROR HANDLER ──────────────────────────── */
app.use((err,_req,res,_next) => { console.error(err); res.status(500).json({ message:'Erro interno no servidor.' }); });

app.listen(PORT, () => {
  console.log(`\nAtende+ API (PostgreSQL/Neon) → porta ${PORT}`);
  console.log(`Admin: ${process.env.ADMIN_EMAIL||'developerwesleymelo@gmail.com'}\n`);
});
