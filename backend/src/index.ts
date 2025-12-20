import express from "express";
import cors from 'cors';

import { connectDatabase } from "./config/db";
import promptRouter from "./routes/prompt.router";
import modelResponseRoute from "./routes/modelResponse.route";

import { initScheduler } from "./services/cronSchedule";



const app = express();

app.use(express.json());

app.use(cors({origin:['http://localhost:3000']}))


app.use("/api/prompt", promptRouter);
app.use("/api/modelresponse", modelResponseRoute);

const port = process.env.PORT || 9000;

app.listen(port,  () => {
    console.log(`server is running on ${process.env.PORT}`);
  });

const wait = async () => {
  
  await connectDatabase();
  await initScheduler();
  
};

wait();
export default app;
