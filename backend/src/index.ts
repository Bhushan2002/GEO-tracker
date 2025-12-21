import express from "express";
import cors from 'cors';

import { connectDatabase } from "./config/db";
import promptRouter from "./routes/prompt.router";
import modelResponseRoute from "./routes/modelResponse.route";
import dotenv from "dotenv";
dotenv.config();
import { initScheduler } from "./services/cronSchedule";



const app = express();


app.use(cors());

app.use(express.json());



app.use("/api/prompt", promptRouter);
app.use("/api/modelresponse", modelResponseRoute);
app.use('/api/brands')

const port = process.env.PORT || 9000;


const wait = async () => {
  
  await connectDatabase();
  await initScheduler();
  app.listen(port,  () => {
    console.log(`server is running on ${process.env.PORT}`);
  });

};

wait();
export default app;
