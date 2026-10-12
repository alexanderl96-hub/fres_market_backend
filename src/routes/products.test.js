import { describe, it, expect } from 'vitest';

// tw:generated products.js
describe('products.js', () => {
  it('loads without throwing', async () => {
    await expect(import('./products')).resolves.toBeDefined();
  });
});
