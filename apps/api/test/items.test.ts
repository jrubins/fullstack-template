import { ApiErrorSchema, ItemSchema, type Item } from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestApp, unique } from './helpers.ts';

const { app, db } = createTestApp();

afterAll(async () => {
  await db.close();
});

async function listItems(): Promise<Item[]> {
  const res = await request(app).get('/items').expect(200);
  return ItemSchema.array().parse(res.body);
}

describe('items API', () => {
  it('creates an item, trimming its name', async () => {
    const name = unique('Deadlift');
    const res = await request(app)
      .post('/items')
      .send({ name: `  ${name} ` })
      .expect(201);

    const item = ItemSchema.parse(res.body);
    expect(item.name).toBe(name);
    expect(await listItems()).toContainEqual(item);
  });

  it('lists newest items first', async () => {
    const first = ItemSchema.parse(
      (
        await request(app)
          .post('/items')
          .send({ name: unique('First') })
      ).body,
    );
    const second = ItemSchema.parse(
      (
        await request(app)
          .post('/items')
          .send({ name: unique('Second') })
      ).body,
    );

    const ids = (await listItems()).map((item) => item.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
  });

  it('deletes an item', async () => {
    const created = ItemSchema.parse(
      (
        await request(app)
          .post('/items')
          .send({ name: unique('Row') })
      ).body,
    );

    await request(app).delete(`/items/${created.id}`).expect(204);

    expect((await listItems()).map((item) => item.id)).not.toContain(created.id);
  });

  it('rejects an invalid item with a validation error', async () => {
    const res = await request(app).post('/items').send({ name: '' }).expect(400);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('validation_error');
  });

  it('returns 404 when deleting a missing item', async () => {
    // Deleting twice: the second call targets an id that is certain not to exist.
    const created = ItemSchema.parse(
      (
        await request(app)
          .post('/items')
          .send({ name: unique('Gone') })
      ).body,
    );
    await request(app).delete(`/items/${created.id}`).expect(204);

    const res = await request(app).delete(`/items/${created.id}`).expect(404);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('not_found');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/items')
      .set('content-type', 'application/json')
      .send('{bad')
      .expect(400);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('bad_request');
  });
});
