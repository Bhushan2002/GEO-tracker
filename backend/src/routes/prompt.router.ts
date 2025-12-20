import { Router } from "express";
import { createPromprt, getPrompts } from "../controllers/prompt.controller";


const router = Router();

router.post('/', createPromprt);
router.get('/getprompts',getPrompts)



export default router;