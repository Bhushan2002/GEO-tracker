import { Router } from "express";
import { createTargetBrand, getTargetBrands, initializeBrandTask, stopBrandTask } from "../controllers/targetbarnd.controller";

const router = Router();

router.get("/", getTargetBrands);
router.post("/", createTargetBrand);
router.patch("/schedule-run/:id", initializeBrandTask);
router.patch("/schedule-stop/:id", stopBrandTask);
export default router;