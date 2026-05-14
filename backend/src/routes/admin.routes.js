import { Router } from 'express';
import {
  exportarAtendimentos,
  listarAtendimentosProfissional,
  listarProfissionais
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/profissionais', listarProfissionais);
router.get('/profissionais/:id/atendimentos', listarAtendimentosProfissional);
router.get('/exportar', exportarAtendimentos);

export default router;
