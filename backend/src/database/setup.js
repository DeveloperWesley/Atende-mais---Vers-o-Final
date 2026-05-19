import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log('✅ Conectado ao PostgreSQL (Neon)');

    /* 1. Criar tabelas */
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Tabelas criadas com sucesso');

    /* 2. Criar admin se não existir */
    const adminEmail = (process.env.ADMIN_EMAIL || 'developerwesleymelo@gmail.com').toLowerCase();
    const adminPass  = process.env.ADMIN_PASSWORD || 'adm123';
    const adminNome  = process.env.ADMIN_NOME     || 'Wesley Melo';

    const existe = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);

    if (existe.rows.length === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await client.query(
        `INSERT INTO usuarios (nome, email, senha_hash, perfil, sexo, status, plano)
         VALUES ($1, $2, $3, 'admin', 'Masculino', 'ativo', 'Admin')`,
        [adminNome, adminEmail, hash]
      );
      console.log(`✅ Admin criado: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin já existe: ${adminEmail}`);
    }

    console.log('\n🎉 Setup concluído! Banco pronto para uso.');
  } catch (err) {
    console.error('❌ Erro no setup:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
