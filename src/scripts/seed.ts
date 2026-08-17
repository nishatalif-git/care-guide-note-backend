import { env } from "../config/env";
import { connectDb, disconnectDb, syncAllIndexes } from "../config/db";
import { User } from "../models/user.model";
import { Note } from "../models/note.model";
import { Post } from "../models/post.model";
import { hashPassword } from "../utils/password";

const INTERESTS = [
  "chess",
  "reading",
  "cycling",
  "cooking",
  "photography",
  "gardening",
  "running",
  "music",
];

const FIRST = [
  "Ayesha",
  "Rafi",
  "Nusrat",
  "Tanvir",
  "Sadia",
  "Imran",
  "Mehjabin",
  "Shakib",
  "Farhana",
  "Rakib",
  "Tasnim",
  "Arif",
  "Sumaiya",
  "Nayeem",
  "Jarin",
  "Fahim",
  "Priya",
  "Omar",
  "Lamia",
  "Zayan",
  "Rumi",
  "Sabrina",
  "Hasib",
  "Ishrat",
  "Nabil",
];
const LAST = [
  "Rahman",
  "Hossain",
  "Islam",
  "Ahmed",
  "Karim",
  "Chowdhury",
  "Siddiqui",
];

/** Deterministic pseudo-random so repeated seeds produce comparable data. */
function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const rng = makeRng(20260817);
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(rng() * items.length)] as T;
const between = (min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

async function main() {
  await connectDb();
  await syncAllIndexes();

  console.log("[seed] clearing users, notes, posts");
  await Promise.all([
    User.deleteMany({}),
    Note.deleteMany({}),
    Post.deleteMany({}),
  ]);

  // One shared hash for the demo accounts: Argon2 at 19 MiB is deliberately
  // slow, and hashing 26 identical demo passwords separately buys nothing.
  const demoHash = await hashPassword("Password@123");
  const adminHash = await hashPassword(env.seedAdminPassword);

  const admin = await User.create({
    name: "Site Admin",
    email: env.seedAdminEmail,
    passwordHash: adminHash,
    role: "admin",
    interests: ["chess", "reading"],
  });

  const userDocs = Array.from({ length: 25 }, (_, i) => {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    // Overlapping interest sets so the grouping aggregation has real groups.
    const count = between(1, 3);
    const interests = [
      ...new Set(Array.from({ length: count }, () => pick(INTERESTS))),
    ];
    return {
      name,
      email: `${pick(FIRST).toLowerCase()}.${pick(LAST).toLowerCase() + 1}@care.com`,
      passwordHash: demoHash,
      role: "user" as const,
      interests,
    };
  });

  const users = await User.insertMany(userDocs);
  const everyone = [admin, ...users];
  console.log(
    `[seed] ${everyone.length} users (1 admin, ${users.length} regular)`,
  );

  const notes = everyone.flatMap((user) =>
    Array.from({ length: between(2, 6) }, (_, i) => ({
      title: `${user.name.split(" ")[0]}'s note #${i + 1}`,
      content: `Notes about ${pick(INTERESTS)}. Written for seeding on run ${i + 1}.`,
      owner: user._id,
    })),
  );
  await Note.insertMany(notes);
  console.log(`[seed] ${notes.length} notes`);

  const posts = everyone.flatMap((user) =>
    Array.from({ length: between(0, 5) }, (_, i) => ({
      title: `${pick(INTERESTS)} - post #${i + 1} by ${user.name.split(" ")[0]}`,
      body: "Public post body used to exercise the $lookup aggregation.",
      author: user._id,
    })),
  );
  await Post.insertMany(posts);
  console.log(`[seed] ${posts.length} posts`);

  console.log("\n[seed] done. Sign in with:");
  console.log(
    `       admin -> ${env.seedAdminEmail} / ${env.seedAdminPassword}`,
  );
  console.log("       user  -> user1@care.com / Password@123");

  await disconnectDb();
}

main().catch(async (error) => {
  console.error("[seed] failed:", error);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
