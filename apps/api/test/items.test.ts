import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ApiErrorSchema, ItemSchema } from '@app/shared';
import { createTestApp } from './helpers.ts';

const { app, db } = createTestApp();

beforeEach(async () => {
  // Prisma requires an explicit filter for bulk deletes.
  await db.orm.public.Item.where((item) => item.id.gt(0)).deleteAll();
});

afterAll(async () => {
  await db.close();
});

describe('items API', () => {
  it('creates, lists and deletes an item', async () => {
    const created = await request(app).post('/items').send({ name: '  Deadlift ' }).expect(201);
    const item = ItemSchema.parse(created.body);
    expect(item.name).toBe('Deadlift');

    const list = await request(app).get('/items').expect(200);
    expect(list.body).toEqual([item]);

    await request(app).delete(`/items/${item.id}`).expect(204);
    await request(app).get('/items').expect(200, []);
  });

  it('rejects an invalid item with a validation error', async () => {
    const res = await request(app).post('/items').send({ name: '' }).expect(400);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('validation_error');
  });

  it('returns 404 when deleting a missing item', async () => {
    const res = await request(app).delete('/items/999999').expect(404);
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

describe('GET /health', () => {
  it('reports the database as up', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });
});

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    const res = await request(app).get('/nope').expect(404);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('not_found');
  });
});
