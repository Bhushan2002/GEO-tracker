import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import { connectDatabase } from './config/db.js';
configDotenv();
const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173/' }));
connectDatabase();
// app.use()
app.listen(process.env.PORT, () => {
    console.log(`server is running on ${process.env.PORT}`);
});
