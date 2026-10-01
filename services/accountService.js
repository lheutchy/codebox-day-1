const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { getDatabase } = require("../db/database");

let indexPromise;

function validateCredentials(input) {
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = input?.password;
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { error: "Password must be 8 to 128 characters." };
  }
  return { email, password };
}

async function accounts() {
  const database = await getDatabase();
  const collection = database.collection("accounts");
  if (!indexPromise) {
    indexPromise = collection.createIndex({ email: 1 }, { unique: true }).catch((error) => {
      indexPromise = undefined;
      throw error;
    });
  }
  await indexPromise;
  return collection;
}

async function createAccount(email, password) {
  const collection = await accounts();
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await collection.insertOne({ email, passwordHash, createdAt: new Date() });
  return { id: result.insertedId.toString(), email };
}

async function authenticateAccount(email, password) {
  const collection = await accounts();
  const account = await collection.findOne({ email });
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    return null;
  }
  return { id: account._id.toString(), email: account.email };
}

async function findAccountById(id) {
  if (!/^[a-f\d]{24}$/i.test(id || "")) return null;
  const collection = await accounts();
  const account = await collection.findOne(
    { _id: new ObjectId(id) },
    { projection: { email: 1 } },
  );
  return account ? { id: account._id.toString(), email: account.email } : null;
}

module.exports = {
  validateCredentials,
  createAccount,
  authenticateAccount,
  findAccountById,
};
