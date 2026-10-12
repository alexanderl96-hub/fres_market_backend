import { describe, it, expect } from 'vitest';

// tw:generated auth.js
describe('auth.js', () => {
  it('loads without throwing', async () => {
    await expect(import('./auth')).resolves.toBeDefined();
  });
});
