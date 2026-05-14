const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erro ao comunicar com o servidor.');
  }

  return response.json();
}

export const api = {
  login(credentials) {
    // TODO: integrar com API real
    // TODO: implementar autenticação JWT
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  listarAtendimentos() {
    // TODO: substituir dados mockados
    return request('/atendimentos');
  },

  criarAtendimento(data) {
    // TODO: salvar no PostgreSQL
    return request('/atendimentos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  atualizarAtendimento(id, data) {
    return request(`/atendimentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  excluirAtendimento(id) {
    return request(`/atendimentos/${id}`, {
      method: 'DELETE'
    });
  },

  listarProfissionais() {
    return request('/admin/profissionais');
  },

  listarAtendimentosProfissional(id) {
    return request(`/admin/profissionais/${id}/atendimentos`);
  },

  exportarAdmin(query = '') {
    return request(`/admin/exportar${query}`);
  }
};
