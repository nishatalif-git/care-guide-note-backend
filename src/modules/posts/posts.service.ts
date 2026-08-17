import { Types } from "mongoose";
import { Post } from "../../models/post.model";
import { User } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import {
  paginated,
  toPageParams,
  type Paginated,
} from "../../utils/pagination";

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; email: string };
};


async function resolveAuthorId(term: string): Promise<Types.ObjectId> {
  const query = /^[a-f\d]{24}$/i.test(term)
    ? { _id: new Types.ObjectId(term) }
    : { email: term.toLowerCase() };

  const found = await User.findOne(query).select("_id").lean();
  if (!found) throw ApiError.notFound("No user matches that email or id");
  return new Types.ObjectId(String(found._id));
}


export async function listPosts(query: {
  page?: number;
  limit?: number;
  author?: string;
}): Promise<Paginated<FeedPost>> {
  const page = toPageParams(query);
  const authorId = query.author ? await resolveAuthorId(query.author) : null;
  const filter = authorId ? { author: authorId } : {};

  const [docs, total] = await Promise.all([
    Post.aggregate<FeedPost>([
      ...(authorId ? [{ $match: filter }] : []),
      { $sort: authorId ? { createdAt: -1 } : { _id: -1 } },
      { $skip: page.skip },
      { $limit: page.limit },
      {
        $lookup: {
          from: User.collection.collectionName,
          localField: "author",
          foreignField: "_id",
          as: "authorDoc",
        },
      },
      { $unwind: "$authorDoc" },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: 1,
          body: 1,
          createdAt: 1,
          author: {
            id: "$authorDoc._id",
            name: "$authorDoc.name",
            email: "$authorDoc.email",
          },
        },
      },
    ]),
    authorId ? Post.countDocuments(filter) : Post.estimatedDocumentCount(),
  ]);

  return paginated(docs, total, page);
}
