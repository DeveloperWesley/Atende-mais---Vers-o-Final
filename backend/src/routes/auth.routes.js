import { Router } from 'express';
import { esqueciSenha, login, redefinirSenha, registrar } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/registrar', registrar);
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);

export default router;
