import { describe, it, expect } from 'vitest';
import { requireAuth } from './requireAuth';

// tw:generated requireAuth
describe('requireAuth', () => {
  it('runs with sample input', () => {
    expect(() => requireAuth({ headers: { authorization: 1 }, user: {} }, { status: () => {} }, () => {})).not.toThrow();
  });
});
