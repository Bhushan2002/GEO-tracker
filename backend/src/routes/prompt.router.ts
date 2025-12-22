import { Router } from "express";
import { createPromprt, getPrompts, initializeTask, runManualTask, stopTask,  } from "../controllers/prompt.controller";


const router = Router();

router.post('/', createPromprt);
router.get('/getprompts',getPrompts);
router.post('/:id/start-schedule', initializeTask);
router.post('/:id/stop-schedule', stopTask);
router.post('/:id/run', runManualTask);

export default router;