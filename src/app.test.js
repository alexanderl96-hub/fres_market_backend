import { describe, it, expect } from 'vitest';

// tw:generated app.js
describe('app.js', () => {
  it('loads without throwing', async () => {
    await expect(import('./app')).resolves.toBeDefined();
  });
});
