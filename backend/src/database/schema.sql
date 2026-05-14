CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('profissional', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atendimentos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data_atendimento DATE NOT NULL,
  competencia CHAR(7) NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  pagador_nome VARCHAR(180) NOT NULL,
  pagador_doc VARCHAR(14) NOT NULL CHECK (char_length(pagador_doc) IN (11, 14)),
  paciente_nome VARCHAR(180) NOT NULL,
  paciente_cpf CHAR(11) NOT NULL CHECK (char_length(paciente_cpf) = 11),
  precisa_doc BOOLEAN NOT NULL DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atendimentos_usuario_id ON atendimentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_competencia ON atendimentos(competencia);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON atendimentos(data_atendimento);
CREATE INDEX IF NOT EXISTS idx_atendimentos_pagador_doc ON atendimentos(pagador_doc);
CREATE INDEX IF NOT EXISTS idx_atendimentos_paciente_cpf ON atendimentos(paciente_cpf);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atendimentos_updated_at ON atendimentos;

CREATE TRIGGER trg_atendimentos_updated_at
BEFORE UPDATE ON atendimentos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
