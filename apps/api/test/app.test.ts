import { ApiErrorSchema, HealthSchema } from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.ts';

const { app, db } = createTestApp();

afterAll(async () => {
  await db.close();
});

describe('GET /health', () => {
  it('reports the database as up', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(HealthSchema.parse(res.body)).toMatchObject({ status: 'ok', database: 'up' });
  });
});

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    const res = await request(app).get('/nope').expect(404);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('not_found');
  });
});

describe('CORS', () => {
  it('allows the configured web origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not allow other origins', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
