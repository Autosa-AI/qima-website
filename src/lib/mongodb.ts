import { MongoClient, MongoClientOptions, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

const DB_NAME = "qima";

// Options tuned for serverless (Vercel): short timeouts, no persistent socket
const OPTIONS: MongoClientOptions = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 0,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In dev, reuse the connection across HMR reloads
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(MONGODB_URI, OPTIONS).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production (Vercel), each function invocation may be a cold start
  clientPromise = new MongoClient(MONGODB_URI, OPTIONS).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export default clientPromise;
