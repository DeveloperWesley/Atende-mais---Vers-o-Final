-- ================================================
--  Atende+ — Schema PostgreSQL
-- ================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id            BIGSERIAL PRIMARY KEY,
  nome          VARCHAR(160) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  senha_hash    TEXT NOT NULL,
  perfil        VARCHAR(20)  NOT NULL DEFAULT 'profissional' CHECK (perfil IN ('profissional','admin')),
  especialidade VARCHAR(100),
  sexo          VARCHAR(20)  NOT NULL DEFAULT 'Não informar',
  profissao     VARCHAR(100),
  conselho      VARCHAR(60),
  telefone      VARCHAR(25),
  status        VARCHAR(20)  NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativo','pendente','inativo')),
  plano         VARCHAR(20)  NOT NULL DEFAULT 'Básico',
  ultimo_acesso TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reset_tokens (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  usado       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome        VARCHAR(180) NOT NULL,
  cpf         VARCHAR(14)  NOT NULL,
  telefone    VARCHAR(25),
  email       VARCHAR(160),
  ultimo_atendimento DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_usuario_cpf ON pacientes(usuario_id, cpf);
CREATE INDEX        IF NOT EXISTS idx_pacientes_usuario_id  ON pacientes(usuario_id);

CREATE TABLE IF NOT EXISTS atendimentos (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data            DATE   NOT NULL,
  hora            TIME,
  paciente        VARCHAR(180) NOT NULL,
  pagador         VARCHAR(180) NOT NULL,
  cpf_paciente    VARCHAR(14)  NOT NULL,
  cpf_pagador     VARCHAR(14)  NOT NULL,
  valor_num       NUMERIC(12,2) NOT NULL CHECK (valor_num > 0),
  situacao        VARCHAR(20) NOT NULL DEFAULT 'concluido',
  recebimento     VARCHAR(20) NOT NULL DEFAULT 'recebido',
  documentacao    VARCHAR(20) NOT NULL DEFAULT 'pendente',
  nf_status       VARCHAR(20) NOT NULL DEFAULT 'pendente',
  receita_saude   VARCHAR(10) NOT NULL DEFAULT 'pronto',
  servico         VARCHAR(50) NOT NULL DEFAULT 'Consulta',
  forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'PIX',
  precisa_doc     BOOLEAN NOT NULL DEFAULT FALSE,
  paciente_telefone VARCHAR(25),
  paciente_email    VARCHAR(160),
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atendimentos_usuario_id  ON atendimentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data        ON atendimentos(data);

CREATE TABLE IF NOT EXISTS despesas (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data            DATE   NOT NULL,
  descricao       VARCHAR(255) NOT NULL,
  categoria       VARCHAR(100) NOT NULL,
  valor_num       NUMERIC(12,2) NOT NULL CHECK (valor_num > 0),
  forma_pagamento VARCHAR(30)  NOT NULL,
  comprovante_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_usuario_id ON despesas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data       ON despesas(data);

CREATE TABLE IF NOT EXISTS notificacoes (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  texto       TEXT NOT NULL,
  tipo        VARCHAR(30) NOT NULL DEFAULT 'admin',
  lida        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);

-- ── Triggers updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_updated_at     ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pacientes_updated_at    ON pacientes;
CREATE TRIGGER trg_pacientes_updated_at
  BEFORE UPDATE ON pacientes    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_atendimentos_updated_at ON atendimentos;
CREATE TRIGGER trg_atendimentos_updated_at
  BEFORE UPDATE ON atendimentos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_despesas_updated_at     ON despesas;
CREATE TRIGGER trg_despesas_updated_at
  BEFORE UPDATE ON despesas     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
