import {
  Schema,
  model,
  type InferSchemaType,
  type HydratedDocument,
} from "mongoose";

// As per Task there is only 2 role descibed, So makes it constant
export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES, default: "user" },
    interests: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

// as per task index should created with schema.index() only
userSchema.index({ email: 1 }, { unique: true, name: "email_unique" });

// index added to retirive list data in descending order
userSchema.index({ createdAt: -1 }, { name: "createdAt_desc" });

// added multikey index backing the $match stage, including the optional ?interest=chess filter.
userSchema.index({ interests: 1 }, { name: "interests_multikey" });

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;

export const User = model("User", userSchema);
