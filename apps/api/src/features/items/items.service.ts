import * as Sentry from '@sentry/node';
import type { Db } from '@app/db';
import type { CreateItem, Item } from '@app/shared';
import { notFound } from '../../lib/http-error.ts';

type ItemRow = { id: number; name: string; createdAt: Date };

const toItem = (row: ItemRow): Item => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

/** Business logic for items. Handlers stay thin; the database is only touched here. */
export function createItemsService(db: Db) {
  return {
    async list(): Promise<Item[]> {
      const rows = await db.orm.public.Item.orderBy((item) => item.createdAt.desc())
        .limit(100)
        .all();
      return rows.map(toItem);
    },

    async create(input: CreateItem): Promise<Item> {
      const row = await db.orm.public.Item.create({ name: input.name });
      // Example custom metric (a no-op while Sentry is disabled).
      Sentry.metrics.count('items.created', 1);
      return toItem(row);
    },

    async remove(id: number): Promise<void> {
      const deleted = await db.orm.public.Item.where({ id }).delete();
      if (!deleted) throw notFound(`Item ${id} not found`);
    },
  };
}

export type ItemsService = ReturnType<typeof createItemsService>;
