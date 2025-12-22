import { Router } from "express";
import { createPromprt, getPrompts, initializeTask, stopTask,  } from "../controllers/prompt.controller";


const router = Router();

router.post('/', createPromprt);
router.get('/getprompts',getPrompts);
router.post('/:id/start-schedule',initializeTask);
router.post('/:id/stop-schedule',stopTask)


export default router;