import mongoose from "mongoose"
import { configDotenv } from "dotenv";
configDotenv();
export const connectDatabase = async ()=>{
    const url = process.env.MONGO_URL!;
    try{
        await mongoose.connect(url);
        console.log("Database Connected")
    }catch(e){
        console.log(e)
    }
}