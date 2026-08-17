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

// as per task index created with schema.index() only
userSchema.index({ email: 1 }, { unique: true, name: "email_unique" });

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;

export const User = model("User", userSchema);
