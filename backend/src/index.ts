import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { connectDatabase } from "./config/db";
import promptRouter from "./routes/prompt.router";
import modelResponseRoute from "./routes/modelResponse.route";
import { connect } from "node:http2";
import { initScheduler } from "./services/cronSchedule";

configDotenv();

const app = express();

app.use(express.json());

// app.use(cors({origin: 'http://localhost:5173/'}))

app.use("/api/prompt", promptRouter);
app.use("/api/modelresponse", modelResponseRoute);

const wait = async () => {
  await connectDatabase();
  await initScheduler();
  app.listen(process.env.PORT, () => {
    console.log(`server is running on ${process.env.PORT}`);
  });
};
wait();
export default app;
