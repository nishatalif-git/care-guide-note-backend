import mongoose from "mongoose";
import { env, isProduction } from "./env";


export async function connectDb(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  mongoose.set("autoIndex", false);

  const conn = await mongoose.connect(env.mongoUri);
  const dbName = conn.connection.name;
  console.log(`Database Connected: "${dbName}"`);
  return conn;
}

export async function syncAllIndexes(): Promise<void> {
  const names = Object.keys(mongoose.models);
  for (const name of names) {
    const model = mongoose.models[name];
    if (!model) continue;
    await model.syncIndexes();
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export { isProduction };
