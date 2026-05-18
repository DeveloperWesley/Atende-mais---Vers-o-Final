import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware.js';
import {
  atualizarDespesa,
  criarDespesa,
  excluirDespesa,
  listarDespesas,
} from '../controllers/despesas.controller.js';

const router = Router();

router.use(autenticar);

router.get('/', listarDespesas);
router.post('/', criarDespesa);
router.put('/:id', atualizarDespesa);
router.delete('/:id', excluirDespesa);

export default router;
