import { Hono } from 'hono';

const app = new Hono().basePath('/api/v2').get('/health', (c) => {
  return c.text('Hello');
});

export default defineEventHandler((event) => {
  return app.fetch(toWebRequest(event));
});
