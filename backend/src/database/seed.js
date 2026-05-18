import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from './connection.js';

dotenv.config();

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'developerwesleymelo@gmail.com';
  const senha = process.env.ADMIN_PASSWORD || 'adm123';
  const nome  = process.env.ADMIN_NOME    || 'Wesley Melo';

  const { rows: existing } = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (existing.length > 0) {
    console.log(`Admin já existe: ${email}`);
    process.exit(0);
  }

  const senha_hash = await bcrypt.hash(senha, 10);
  await query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, especialidade, status, plano)
     VALUES ($1, $2, $3, 'admin', 'Administrador', 'ativo', 'Admin')`,
    [nome, email, senha_hash]
  );

  console.log(`Admin criado com sucesso!`);
  console.log(`  E-mail: ${email}`);
  console.log(`  Senha:  ${senha}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro ao criar admin:', err.message);
  process.exit(1);
});
