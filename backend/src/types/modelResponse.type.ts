import mongoose = require("mongoose");

export interface PromptResponce{
    promptId: mongoose.Types.ObjectId;
    modelName: string,
    content : string, 
    timestamp: Date,

};
