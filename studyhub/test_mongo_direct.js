const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const url = process.env.DATABASE_URL;
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    const db = client.db(); // uses db name from URL
    console.log('Using database:', db.databaseName);

    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`Collection "${col.name}" has ${count} documents.`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main();
