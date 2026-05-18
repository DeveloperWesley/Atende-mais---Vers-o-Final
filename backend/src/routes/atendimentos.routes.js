import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware.js';
import {
  atualizarAtendimento,
  criarAtendimento,
  excluirAtendimento,
  listarAtendimentos,
} from '../controllers/atendimentos.controller.js';

const router = Router();

router.use(autenticar);

router.get('/', listarAtendimentos);
router.post('/', criarAtendimento);
router.put('/:id', atualizarAtendimento);
router.delete('/:id', excluirAtendimento);

export default router;
