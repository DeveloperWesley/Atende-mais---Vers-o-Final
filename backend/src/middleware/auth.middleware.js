import jwt from 'jsonwebtoken';

export function autenticar(request, response, next) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Token de autenticação necessário.' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.user = payload;
    next();
  } catch {
    return response.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

export function apenasAdmin(request, response, next) {
  if (request.user?.perfil !== 'admin') {
    return response.status(403).json({ message: 'Acesso restrito a administradores.' });
  }
  next();
}
