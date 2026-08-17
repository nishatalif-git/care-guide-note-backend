import { Types } from "mongoose";
import { User, type Role } from "../../models/user.model";

import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/password";
import {
  paginated,
  toPageParams,
  type Paginated,
} from "../../utils/pagination";
import { toPublicUser, type PublicUser } from "../auth/auth.service";


export async function listUsers(query: {
  page?: number;
  limit?: number;
}): Promise<Paginated<PublicUser>> {
  const page = toPageParams(query);

  const [docs, total] = await Promise.all([
    User.find({})
      .sort({ createdAt: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),  
    User.estimatedDocumentCount(),
  ]);

  return paginated(docs.map(toPublicUser), total, page);
}


export async function getUser(userId: string): Promise<PublicUser> {
  const found = await User.findById(userId).lean();
  if (!found) throw ApiError.notFound("User not found");
  return toPublicUser(found);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  interests: string[];
}): Promise<PublicUser> {
  const existing = await User.findOne({ email: input.email })
    .select("_id")
    .lean();
  if (existing) throw ApiError.conflict("That email is already registered");

  const created = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    interests: input.interests,
  });
  return toPublicUser(created);
}

export async function updateUser(
  userId: string,
  input: {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    interests?: string[];
  },
): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (input.email && input.email !== user.email) {
    const clash = await User.findOne({ email: input.email })
      .select("_id")
      .lean();
    if (clash) throw ApiError.conflict("That email is already registered");
    user.email = input.email;
  }
  if (input.name !== undefined) user.name = input.name;
  if (input.role !== undefined) user.role = input.role;
  if (input.interests !== undefined) user.interests = input.interests;
  if (input.password !== undefined)
    user.passwordHash = await hashPassword(input.password);

  await user.save();
  return toPublicUser(user);
}

export async function deleteUser(
  actorId: string,
  userId: string,
): Promise<void> {
  if (actorId === userId) {
    throw ApiError.badRequest(
      "You cannot delete your own account while signed in",
    );
  }

  const user = await User.findById(userId).select("_id").lean();
  if (!user) throw ApiError.notFound("User not found");

  const ownerId = new Types.ObjectId(userId);
  
  await User.deleteOne({ _id: ownerId })
  
}


export type InterestGroup = {
  interest: string;
  count: number;
  users: { id: string; name: string; email: string }[];
};

export async function groupUsersByInterest(query: {
  page?: number;
  limit?: number;
  interest?: string;
}): Promise<Paginated<InterestGroup>> {
  const page = toPageParams(query);

  const match = query.interest
    ? { interests: query.interest }
    : { interests: { $type: "string" as const } };

  const [result] = await User.aggregate<{
    data: InterestGroup[];
    total: number;
  }>([
    { $match: match },
    { $unwind: "$interests" },
    
    ...(query.interest ? [{ $match: { interests: query.interest } }] : []),
    {
      $group: {
        _id: "$interests",
        count: { $sum: 1 },
        users: { $push: { id: "$_id", name: "$name", email: "$email" } },
      },
    },
    // Most popular first; _id breaks ties so paging is deterministic.
    { $sort: { count: -1, _id: 1 } },
    {
      $facet: {
        data: [
          { $skip: page.skip },
          { $limit: page.limit },
          { $project: { _id: 0, interest: "$_id", count: 1, users: 1 } },
        ],
        meta: [{ $count: "total" }],
      },
    },
    {
      $project: {
        data: 1,
        total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
      },
    },
  ]);

  return paginated(result?.data ?? [], result?.total ?? 0, page);
}


