import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import adminRoutes from './routes/admin.routes.js';
import atendimentosRoutes from './routes/atendimentos.routes.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/atendimentos', atendimentosRoutes);
app.use('/admin', adminRoutes);

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({
    message: 'Erro interno no servidor.'
  });
});

app.listen(port, () => {
  console.log(`Atende+ API rodando na porta ${port}`);
});
