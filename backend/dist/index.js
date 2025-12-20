"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./config/db");
const prompt_router_1 = __importDefault(require("./routes/prompt.router"));
const modelResponse_route_1 = __importDefault(require("./routes/modelResponse.route"));
const cronSchedule_1 = require("./services/cronSchedule");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api/prompt", prompt_router_1.default);
app.use("/api/modelresponse", modelResponse_route_1.default);
const port = process.env.PORT || 9000;
app.listen(port, () => {
    console.log(`server is running on ${process.env.PORT}`);
});
const wait = async () => {
    await (0, db_1.connectDatabase)();
    await (0, cronSchedule_1.initScheduler)();
};
wait();
exports.default = app;
