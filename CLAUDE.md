# Atende+

Sempre responda em português do Brasil.

## Sobre o projeto

Atende+ é uma aplicação web para profissionais de saúde registrarem e gerenciarem atendimentos/consultas com dados fiscais e financeiros.

## Stack

- **Frontend:** React 18 + Vite + React Router + Lucide icons + CSS customizado
- **Backend:** Node.js + Express + PostgreSQL (pg)
- **Banco:** PostgreSQL com tabelas `usuarios` e `atendimentos`

## Estrutura

```
frontend/src/
  pages/        # Login, Dashboard, AdminDashboard, NovoAtendimento
  components/   # Button, Input, Header, Sidebar, AtendimentoForm, AtendimentoTable, CardResumo
  contexts/     # AuthContext
  services/     # api.js (cliente HTTP)
  styles/       # global.css

backend/src/
  routes/       # auth, atendimentos, admin
  controllers/  # auth, atendimentos, admin
  database/     # connection.js, schema.sql
  server.js
```
