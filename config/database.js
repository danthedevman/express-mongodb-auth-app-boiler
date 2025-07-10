const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

let client;

async function connectMainDB() {
  //console.log("connecting to maindb");
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(process.env.MAIN_DB_NAME);
}

async function getUserDB(userId) {
  const dbName = `userdb_${userId}`;
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

module.exports = { connectMainDB, getUserDB };
