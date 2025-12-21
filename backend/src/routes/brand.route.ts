import { Router } from "express";
import { createBrand, getBrand } from "../controllers/brand.controller";



const router = Router();

router.get('/',getBrand);
router.post('/' , createBrand);


export default router;
