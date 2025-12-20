import express from "express";


import { connectDatabase } from "./config/db";
import promptRouter from "./routes/prompt.router";
import modelResponseRoute from "./routes/modelResponse.route";

import { initScheduler } from "./services/cronSchedule";



const app = express();

app.use(express.json());



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
