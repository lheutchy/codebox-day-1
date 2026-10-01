const { MongoClient } = require("mongodb");

let databasePromise;
let client;

function getDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Set it in your local .env file.");
  }

  if (!databasePromise) {
    client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    databasePromise = client
      .connect()
      .then(() => client.db(process.env.MONGODB_DB || "codebox_recipe_box"))
      .catch(async (error) => {
        await client.close().catch(() => {});
        databasePromise = undefined;
        client = undefined;
        throw error;
      });
  }

  return databasePromise;
}

async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  databasePromise = undefined;
}

module.exports = { getDatabase, closeDatabase };
