const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Try to manual parse .env
const envPath = path.join(__dirname, 'backend', '.env');
let mongoUri = '';
try {
    const env = fs.readFileSync(envPath, 'utf8');
    const match = env.match(/MONGO_URI=(.*)/);
    if (match) mongoUri = match[1].trim();
} catch (e) { }

if (!mongoUri) {
    mongoUri = "mongodb+srv://banderada_db_user:banderada@api.i4z6szt.mongodb.net/";
}

async function run() {
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log("Databases found:");
        dbs.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
