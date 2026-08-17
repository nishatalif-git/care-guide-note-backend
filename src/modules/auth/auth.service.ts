import { randomBytes } from "node:crypto";
import { User, type Role } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signToken } from "../../middleware/auth";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
  createdAt: Date;
};

export function toPublicUser(doc: {
  _id: unknown;
  name: string;
  email: string;
  role: Role;
  interests: string[];
  createdAt?: Date;
}): PublicUser {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    interests: doc.interests ?? [],
    createdAt: doc.createdAt ?? new Date(0),
  };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  interests: string[];
}): Promise<{ user: PublicUser; token: string }> {
 
  const existing = await User.findOne({ email: input.email })
    .select("_id")
    .lean();
  if (existing) {
    throw ApiError.conflict("That email is already registered");
  }

  const created = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: "user",
    interests: input.interests,
  });

  const user = toPublicUser(created);
  return { user, token: signToken(user) };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  // The only place passwordHash is ever selected.
  const found = await User.findOne({ email: input.email }).select(
    "+passwordHash",
  );

  
  const ok = found
    ? await verifyPassword(input.password, found.passwordHash)
    : await verifyPassword(input.password, await decoyHash());

  if (!found || !ok) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const user = toPublicUser(found);
  return { user, token: signToken(user) };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const found = await User.findById(userId).lean();
  if (!found) throw ApiError.notFound("User not found");
  return toPublicUser(found);
}


let decoy: Promise<string> | null = null;
function decoyHash(): Promise<string> {
  decoy ??= hashPassword(randomBytes(32).toString("hex"));
  return decoy;
}
