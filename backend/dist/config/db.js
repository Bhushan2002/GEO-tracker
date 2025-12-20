"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const connectDatabase = async () => {
    const url = process.env.MONGO_URL;
    try {
        await mongoose_1.default.connect(url);
        console.log("Database Connected");
    }
    catch (e) {
        console.log(e);
    }
};
exports.connectDatabase = connectDatabase;
