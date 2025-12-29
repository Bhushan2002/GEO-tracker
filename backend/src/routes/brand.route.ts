import { Router } from "express";
import { createBrand, getBrand, getBrandHistory } from "../controllers/brand.controller";



const router = Router();

router.get('/',getBrand);
router.get('/history', getBrandHistory);
router.post('/' , createBrand);


export default router;
