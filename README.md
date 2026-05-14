# Atende+

App web para profissionais da saúde registrarem atendimentos e permitir extração de dados para NF/recibo, Receita Saúde, IRPF e controle financeiro básico.

## Tecnologias

- Frontend: React + Vite + JavaScript
- Backend: Node.js + Express
- Banco: PostgreSQL

## Como Rodar

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Links locais:

- App: `http://127.0.0.1:5174/login`
- API: `http://127.0.0.1:3333`

## Banco de Dados

O schema PostgreSQL está em:

```text
backend/src/database/schema.sql
```

## Observação

A primeira versão usa dados mockados no frontend/backend, com pontos de integração marcados por comentários `TODO`.
