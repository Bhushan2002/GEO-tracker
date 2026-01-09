
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Manual connection for script
const MONGO_URL = "mongodb+srv://bhushansatpute2002:vV4vM0tL1200T6Xq@geo-cluster.f93sh.mongodb.net/test?retryWrites=true&w=majority&appName=geo-cluster";

async function clearData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('Connected.');

        const WorkspaceSchema = new mongoose.Schema({ name: String });
        const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);

        const BrandSchema = new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId });
        const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);

        const PromptSchema = new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId });
        const Prompt = mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema);

        const TargetBrandSchema = new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId });
        const TargetBrand = mongoose.models.TargetBrand || mongoose.model('TargetBrand', TargetBrandSchema);

        const ModelResponseSchema = new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId });
        const ModelResponse = mongoose.models.ModelResponse || mongoose.model('ModelResponse', ModelResponseSchema);

        const workspace = await Workspace.findOne({ name: 'The Blog Chatter' });
        if (!workspace) {
            console.log('Workspace "The Blog Chatter" not found.');
            return;
        }

        const wsId = workspace._id;
        console.log(`Clearing data for workspace ${workspace.name} (${wsId})`);

        const bRes = await Brand.deleteMany({ workspaceId: wsId });
        const pRes = await Prompt.deleteMany({ workspaceId: wsId });
        const tRes = await TargetBrand.deleteMany({ workspaceId: wsId });
        const mRes = await ModelResponse.deleteMany({ workspaceId: wsId });

        console.log(`Cleared: ${bRes.deletedCount} brands, ${pRes.deletedCount} prompts, ${tRes.deletedCount} target brands, ${mRes.deletedCount} responses.`);

        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error('Error:', err);
    }
}

clearData();
