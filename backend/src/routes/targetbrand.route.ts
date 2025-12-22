import { Router } from "express";
import { createTargetBrand, getTargetBrands } from "../controllers/targetbarnd.controller";

const router = Router();

router.get("/", getTargetBrands);
router.post("/", createTargetBrand);

export default router;