import { describe, it, expect } from 'vitest';

// tw:generated server.js
describe('server.js', () => {
  it('loads without throwing', async () => {
    process.env.PORT = '0';
    await expect(import('./server')).resolves.toBeDefined();
  });
});
