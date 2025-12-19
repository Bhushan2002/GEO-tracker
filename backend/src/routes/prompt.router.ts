import { Router } from "express";
import { createPromprt } from "../controllers/prompt.controller";


const router = Router();

router.post('/', createPromprt);




export default router;