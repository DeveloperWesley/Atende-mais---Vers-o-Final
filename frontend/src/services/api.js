const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

let _impersonateId = null;

export function setImpersonateId(id) {
  _impersonateId = id;
}

function getToken() {
  return localStorage.getItem('atende_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(_impersonateId ? { 'X-Impersonate-Id': String(_impersonateId) } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Erro ao comunicar com o servidor.');
  return data;
}

export const api = {
  /* ── Auth ── */
  login:          (d) => request('/auth/login',          { method: 'POST', body: JSON.stringify(d) }),
  registrar:      (d) => request('/auth/registrar',      { method: 'POST', body: JSON.stringify(d) }),
  enviarCodigo:   (d) => request('/auth/enviar-codigo',  { method: 'POST', body: JSON.stringify(d) }),
  verificarCodigo:(d) => request('/auth/verificar-codigo',{ method: 'POST', body: JSON.stringify(d) }),
  reenviarCodigo: (email) => request('/auth/reenviar-codigo', { method: 'POST', body: JSON.stringify({ email }) }),
  esqueciSenha:   (email) => request('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) }),
  redefinirSenha: (d) => request('/auth/redefinir-senha', { method: 'POST', body: JSON.stringify(d) }),
  meuPerfil:      ()  => request('/auth/me'),
  atualizarPerfil:(d) => request('/auth/me',    { method: 'PUT',  body: JSON.stringify(d) }),
  alterarSenha:   (d) => request('/auth/senha', { method: 'PUT',  body: JSON.stringify(d) }),

  /* ── Atendimentos ── */
  listarAtendimentos:   ()      => request('/atendimentos'),
  criarAtendimento:     (d)     => request('/atendimentos',     { method: 'POST', body: JSON.stringify(d) }),
  atualizarAtendimento: (id, d) => request(`/atendimentos/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
  excluirAtendimento:   (id)    => request(`/atendimentos/${id}`, { method: 'DELETE' }),

  /* ── Despesas ── */
  listarDespesas:   ()      => request('/despesas'),
  criarDespesa:     (d)     => request('/despesas',     { method: 'POST', body: JSON.stringify(d) }),
  atualizarDespesa: (id, d) => request(`/despesas/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
  excluirDespesa:   (id)    => request(`/despesas/${id}`, { method: 'DELETE' }),

  /* ── Pacientes ── */
  listarPacientes:   ()      => request('/pacientes'),
  criarPaciente:     (d)     => request('/pacientes',     { method: 'POST', body: JSON.stringify(d) }),
  atualizarPaciente: (id, d) => request(`/pacientes/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
  excluirPaciente:   (id)    => request(`/pacientes/${id}`, { method: 'DELETE' }),

  /* ── Notificações ── */
  listarNotificacoes:    ()   => request('/notificacoes'),
  marcarTodasLidas:      ()   => request('/notificacoes/lidas', { method: 'PATCH' }),
  marcarUmaLida:         (id) => request(`/notificacoes/${id}/lida`, { method: 'PATCH' }),
  excluirNotificacao:    (id) => request(`/notificacoes/${id}`, { method: 'DELETE' }),

  /* ── Relatórios ── */
  listarRelatorios:  ()      => request('/relatorios'),
  salvarRelatorio:   (d)     => request('/relatorios',     { method: 'POST',   body: JSON.stringify(d) }),
  excluirRelatorio:  (id)    => request(`/relatorios/${id}`, { method: 'DELETE' }),

  /* ── Admin — profissionais ── */
  listarProfissionais:          ()   => request('/admin/profissionais'),
  listarAtendimentosProfissional:(id) => request(`/admin/profissionais/${id}/atendimentos`),
  aprovarUsuario:    (id) => request(`/admin/profissionais/${id}/aprovar`,   { method: 'PATCH' }),
  rejeitarUsuario:   (id) => request(`/admin/profissionais/${id}/rejeitar`,  { method: 'PATCH' }),
  desativarUsuario:  (id) => request(`/admin/profissionais/${id}/desativar`, { method: 'PATCH' }),
  reativarUsuario:   (id) => request(`/admin/profissionais/${id}/reativar`,  { method: 'PATCH' }),
  excluirUsuario:    (id) => request(`/admin/profissionais/${id}`,           { method: 'DELETE' }),
  exportarAdmin:     (q = '') => request(`/admin/exportar${q}`),

  /* ── Admin — notificações ── */
  listarAdminNotificacoes:      ()        => request('/admin/notificacoes'),
  marcarTodasAdminLidas:        ()        => request('/admin/notificacoes/lidas', { method: 'PATCH' }),
  marcarUmaAdminLida:           (id)      => request(`/admin/notificacoes/${id}/lida`, { method: 'PATCH' }),
  enviarNotificacao:            (d)       => request('/admin/notificacoes', { method: 'POST', body: JSON.stringify(d) }),

  /* ── Admin — configurações do sistema ── */
  listarAdminConfig:  ()  => request('/admin/configuracoes'),
  salvarAdminConfig:  (d) => request('/admin/configuracoes', { method: 'PUT', body: JSON.stringify(d) }),
};
