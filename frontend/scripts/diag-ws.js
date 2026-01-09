
const mongoose = require('mongoose');
const MONGO_URL = "mongodb+srv://bhushansatpute2002:vV4vM0tL1200T6Xq@geo-cluster.f93sh.mongodb.net/test?retryWrites=true&w=majority&appName=geo-cluster";

async function run() {
    try {
        console.log('Connecting...');
        await mongoose.connect(MONGO_URL, { connectTimeoutMS: 10000 });
        console.log('Connected.');
        const Workspace = mongoose.model('Workspace', new mongoose.Schema({ name: String, isDefault: Boolean }));
        const workspaces = await Workspace.find();
        console.log('Workspaces:', JSON.stringify(workspaces, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error('FAILED TO CONNECT:', err.message);
    }
}
run();
