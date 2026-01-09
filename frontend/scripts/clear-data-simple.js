
const mongoose = require('mongoose');

const MONGO_URL = "mongodb+srv://bhushansatpute2002:vV4vM0tL1200T6Xq@geo-cluster.f93sh.mongodb.net/test?retryWrites=true&w=majority&appName=geo-cluster";

async function run() {
    try {
        console.log('Connecting...');
        await mongoose.connect(MONGO_URL);
        console.log('Connected.');

        const Workspace = mongoose.model('Workspace', new mongoose.Schema({ name: String }));
        const Brand = mongoose.model('Brand', new mongoose.Schema({ brand_name: String, workspaceId: mongoose.Schema.Types.ObjectId }));
        const TargetBrand = mongoose.model('TargetBrand', new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId }));
        const Prompt = mongoose.model('Prompt', new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId }));
        const ModelResponse = mongoose.model('ModelResponse', new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId }));

        const ws = await Workspace.findOne({ name: 'The Blog Chatter' });
        if (!ws) {
            console.log('Workspace NOT found');
            return;
        }
        console.log('Found The Blog Chatter:', ws._id);

        const counts = {
            brands: await Brand.countDocuments({ workspaceId: ws._id }),
            targetBrands: await TargetBrand.countDocuments({ workspaceId: ws._id }),
            prompts: await Prompt.countDocuments({ workspaceId: ws._id }),
            modelResponses: await ModelResponse.countDocuments({ workspaceId: ws._id })
        };

        console.log('Counts for The Blog Chatter:', counts);

        if (Object.values(counts).some(c => c > 0)) {
            console.log('Clearing data...');
            await Brand.deleteMany({ workspaceId: ws._id });
            await TargetBrand.deleteMany({ workspaceId: ws._id });
            await Prompt.deleteMany({ workspaceId: ws._id });
            await ModelResponse.deleteMany({ workspaceId: ws._id });
            console.log('Data cleared.');
        } else {
            console.log('No data to clear.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
