import { Router } from 'express';
import { CreateItemSchema, ItemIdParamsSchema } from '@app/shared';
import { validate } from '../../lib/validate.ts';
import type { ItemsService } from './items.service.ts';

export function itemsRouter(items: ItemsService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await items.list());
  });

  router.post('/', async (req, res) => {
    const input = validate(CreateItemSchema, req.body);
    res.status(201).json(await items.create(input));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = validate(ItemIdParamsSchema, req.params);
    await items.remove(id);
    res.status(204).end();
  });

  return router;
}
