"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const targetbarnd_controller_1 = require("../controllers/targetbarnd.controller");
const router = (0, express_1.Router)();
router.get("/", targetbarnd_controller_1.getTargetBrands);
router.post("/", targetbarnd_controller_1.createTargetBrand);
exports.default = router;
