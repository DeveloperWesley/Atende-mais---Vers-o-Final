import { Router } from 'express';
import {
  atualizarAtendimento,
  criarAtendimento,
  excluirAtendimento,
  listarAtendimentos
} from '../controllers/atendimentos.controller.js';

const router = Router();

router.get('/', listarAtendimentos);
router.post('/', criarAtendimento);
router.put('/:id', atualizarAtendimento);
router.delete('/:id', excluirAtendimento);

export default router;
