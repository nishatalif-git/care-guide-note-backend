import { Types, type FilterQuery } from "mongoose";
import { Note, type NoteAttrs } from "../../models/note.model";
import { ApiError } from "../../utils/ApiError";
import {
  paginated,
  toPageParams,
  type Paginated,
} from "../../utils/pagination";
import type { AuthUser } from "../../types/express";

export type NoteView = {
  id: string;
  title: string;
  content: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
};

function toView(doc: {
  _id: unknown;
  title: string;
  content: string;
  owner: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): NoteView {
  return {
    id: String(doc._id),
    title: doc.title,
    content: doc.content,
    owner: String(doc.owner),
    createdAt: doc.createdAt ?? new Date(0),
    updatedAt: doc.updatedAt ?? new Date(0),
  };
}

export async function createNote(
  actor: AuthUser,
  input: { title: string; content: string },
): Promise<NoteView> {
  const created = await Note.create({
    ...input,
    owner: new Types.ObjectId(actor.id),
  });
  return toView(created);
}


export async function listNotes(
  actor: AuthUser,
  query: { page?: number; limit?: number; all?: boolean; owner?: string },
): Promise<Paginated<NoteView>> {
  const isAdmin = actor.role === "admin";
  const page = toPageParams(query);

  let filter: FilterQuery<NoteAttrs>;
  if (isAdmin && query.all) {
    filter = {};
  } else if (isAdmin && query.owner) {
    filter = { owner: new Types.ObjectId(query.owner) };
  } else {
    // A non-admin only ever sees their own, whatever they passed.
    filter = { owner: new Types.ObjectId(actor.id) };
  }

  const [docs, total] = await Promise.all([
    Note.find(filter)
      .sort({ createdAt: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Note.countDocuments(filter),
  ]);

  return paginated(docs.map(toView), total, page);
}


async function findOwned(noteId: string, actor: AuthUser) {
  const note = await Note.findById(noteId);
  if (!note) throw ApiError.notFound("Note not found");

  const isOwner = String(note.owner) === actor.id;
  if (!isOwner && actor.role !== "admin") {
    // 404 rather than 403: a stranger should not learn the note exists.
    throw ApiError.notFound("Note not found");
  }
  return note;
}

export async function getNote(
  actor: AuthUser,
  noteId: string,
): Promise<NoteView> {
  return toView(await findOwned(noteId, actor));
}

export async function updateNote(
  actor: AuthUser,
  noteId: string,
  input: { title?: string; content?: string },
): Promise<NoteView> {
  const note = await findOwned(noteId, actor);
  // An admin may read anyone's note, but editing stays with the owner.
  if (String(note.owner) !== actor.id) {
    throw ApiError.forbidden("Only the owner can edit this note");
  }
  if (input.title !== undefined) note.title = input.title;
  if (input.content !== undefined) note.content = input.content;
  await note.save();
  return toView(note);
}

export async function deleteNote(
  actor: AuthUser,
  noteId: string,
): Promise<void> {
  const note = await findOwned(noteId, actor);
  await note.deleteOne();
}
