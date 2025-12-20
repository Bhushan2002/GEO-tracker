"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const modelRespons_controller_1 = require("../controllers/modelRespons.controller");
const router = (0, express_1.Router)();
router.get('/modelresponses', modelRespons_controller_1.getModelResponses);
exports.default = router;
