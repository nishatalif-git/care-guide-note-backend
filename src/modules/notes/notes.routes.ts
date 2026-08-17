import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParam } from '../../validation/common';
import { createNoteSchema, listNotesSchema, updateNoteSchema } from './notes.validation';
import * as notesService from './notes.service';

export const notesRouter = Router();


notesRouter.use(requireAuth);

notesRouter.post('/', validate({ body: createNoteSchema }), async (req, res) => {
  const note = await notesService.createNote(req.user!, req.body);
  res.status(201).json({ note });
});

notesRouter.get('/', validate({ query: listNotesSchema }), async (req, res) => {
  res.json(await notesService.listNotes(req.user!, req.query));
});

notesRouter.get('/:id', validate({ params: idParam }), async (req, res) => {
  const note = await notesService.getNote(req.user!, req.params.id as string);
  res.json({ note });
});

notesRouter.patch(
  '/:id',
  validate({ params: idParam, body: updateNoteSchema }),
  async (req, res) => {
    const note = await notesService.updateNote(req.user!, req.params.id as string, req.body);
    res.json({ note });
  },
);

notesRouter.delete('/:id', validate({ params: idParam }), async (req, res) => {
  await notesService.deleteNote(req.user!, req.params.id as string);
  res.status(204).send();
});
