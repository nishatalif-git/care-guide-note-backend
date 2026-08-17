import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const noteSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 20000 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);


// index added for retrive faster ownerwise notes in descending order
noteSchema.index({ owner: 1, createdAt: -1 }, { name: 'owner_createdAt_desc' });

// admin can view all users nnote so added another index to retrive all note in descending order
noteSchema.index({ createdAt: -1 }, { name: 'createdAt_desc' });

export type NoteAttrs = InferSchemaType<typeof noteSchema>;
export type NoteDoc = HydratedDocument<NoteAttrs>;

export const Note = model('Note', noteSchema);
