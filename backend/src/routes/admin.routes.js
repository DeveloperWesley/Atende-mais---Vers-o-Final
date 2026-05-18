import { Router } from 'express';
import { autenticar, apenasAdmin } from '../middleware/auth.middleware.js';
import {
  aprovarUsuario,
  desativarUsuario,
  exportarAtendimentos,
  listarAtendimentosProfissional,
  listarProfissionais,
  reativarUsuario,
  rejeitarUsuario,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(autenticar, apenasAdmin);

router.get('/profissionais', listarProfissionais);
router.get('/profissionais/:id/atendimentos', listarAtendimentosProfissional);
router.patch('/profissionais/:id/aprovar', aprovarUsuario);
router.patch('/profissionais/:id/rejeitar', rejeitarUsuario);
router.patch('/profissionais/:id/desativar', desativarUsuario);
router.patch('/profissionais/:id/reativar', reativarUsuario);
router.get('/exportar', exportarAtendimentos);

export default router;
