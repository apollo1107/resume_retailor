import { MongoClient } from "mongodb";

let clientPromise;

export function mongoEnabled() {
  return Boolean(process.env.MONGODB_URI && String(process.env.MONGODB_URI).trim());
}

export async function getMongoDb() {
  if (!mongoEnabled()) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    clientPromise = client.connect();
  }
  const client = await clientPromise;
  const name = process.env.MONGODB_DB_NAME || "resume_retailor";
  return client.db(name);
}
