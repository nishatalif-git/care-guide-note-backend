import {
  Schema,
  model,
  type InferSchemaType,
  type HydratedDocument,
} from "mongoose";

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 20000 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);

// index added for retrive faster ownerwise postes in descending order
postSchema.index(
  { author: 1, createdAt: -1 },
  { name: "author_createdAt_desc" },
);

export type PostAttrs = InferSchemaType<typeof postSchema>;
export type PostDoc = HydratedDocument<PostAttrs>;

export const Post = model("Post", postSchema);
