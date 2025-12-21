"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brand_controller_1 = require("../controllers/brand.controller");
const router = (0, express_1.Router)();
router.get('/', brand_controller_1.getBrand);
router.post('/', brand_controller_1.createBrand);
exports.default = router;
