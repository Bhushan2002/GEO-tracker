import { Router } from "express";
import { getModelResponses } from "../controllers/modelRespons.controller";


const router = Router();

router.get('/', getModelResponses);

export default router;