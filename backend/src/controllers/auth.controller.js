const mockUser = {
  id: 1,
  nome: 'Dr. João Silva',
  email: 'joao@atendeplus.com.br',
  perfil: 'profissional'
};

export async function login(request, response) {
  const { email, senha } = request.body;

  if (!email || !senha) {
    return response.status(400).json({
      message: 'E-mail e senha são obrigatórios.'
    });
  }

  // TODO: integrar com API real
  // TODO: implementar autenticação JWT
  return response.json({
    token: 'mock-token-atende-plus',
    user: {
      ...mockUser,
      email
    }
  });
}
