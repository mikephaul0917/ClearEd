const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://banderada_db_user:banderada@api.i4z6szt.mongodb.net/";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const dbs = await client.db().admin().listDatabases();
    
    for (const dbObj of dbs.databases) {
      if (dbObj.name !== 'admin' && dbObj.name !== 'local') {
          const db = client.db(dbObj.name);
          const cols = await db.listCollections().toArray();
          const hasInstReqs = cols.some(c => c.name === 'institutionrequests');
          if (hasInstReqs) {
              console.log(`Found institutionrequests collection in DB: ${dbObj.name}`);
              const collection = db.collection('institutionrequests');
              const reqs = await collection.find({}).toArray();
              console.log(`There are ${reqs.length} total reqs in this DB`);
              for (const r of reqs) console.log('Domain:', r.academicDomain);
              
              const result = await collection.deleteMany({ academicDomain: 'shc.edu.ph' });
              console.log(`Deleted ${result.deletedCount} docs in ${dbObj.name}`);
          }
      }
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
