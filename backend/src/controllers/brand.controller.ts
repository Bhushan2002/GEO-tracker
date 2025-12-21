import { Request, Response } from "express";
import { Brand } from "../models/brand.model";

export const getBrand = async (req: Request, res: Response) => {
    try{
        const brand = await Brand.find().sort({mentions: -1});

        if (!brand || brand.length ===0 ){
            return res.status(404).json({message: "No brand found"});

        }
        res.status(200).json(brand);

    }
    catch(e){
        res.status(500).json({message: "Error fetching brands"});
    }
};
