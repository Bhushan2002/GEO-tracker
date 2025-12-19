import { configDotenv } from "dotenv";
import app from ".";
import { connectDatabase } from "./config/db";
import { initScheduler } from "./services/cronSchedule";


(async () => {
  await connectDatabase();
  await initScheduler();

  app.listen(process.env.PORT, () => {
    console.log(`server is running on ${process.env.PORT}`);
  });
})();
