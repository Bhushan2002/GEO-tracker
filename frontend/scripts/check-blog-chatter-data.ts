
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://bhushansatpute2002:vV4vM0tL1200T6Xq@geo-cluster.f93sh.mongodb.net/test?retryWrites=true&w=majority&appName=geo-cluster';

async function checkData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('Connected.');

        const Workspace = mongoose.model('Workspace', new mongoose.Schema({ name: String }));
        const Brand = mongoose.model('Brand', new mongoose.Schema({ brand_name: String, workspaceId: mongoose.Schema.Types.ObjectId }));

        const workspaces = await Workspace.find({});
        console.log('\nWorkspaces:');
        workspaces.forEach(w => console.log(`- ${w.name}: ${w._id}`));

        const blogChatter = workspaces.find(w => w.name === 'The Blog Chatter');
        if (blogChatter) {
            const brands = await Brand.find({ workspaceId: blogChatter._id });
            console.log(`\nBrands for "The Blog Chatter" (${blogChatter._id}): ${brands.length}`);
            brands.forEach(b => console.log(`  - ${b.brand_name}`));
        } else {
            console.log('\n"The Blog Chatter" workspace not found.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkData();
