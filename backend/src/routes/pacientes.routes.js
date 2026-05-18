import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware.js';
import {
  atualizarPaciente,
  criarPaciente,
  excluirPaciente,
  listarPacientes,
} from '../controllers/pacientes.controller.js';

const router = Router();

router.use(autenticar);

router.get('/', listarPacientes);
router.post('/', criarPaciente);
router.put('/:id', atualizarPaciente);
router.delete('/:id', excluirPaciente);

export default router;
