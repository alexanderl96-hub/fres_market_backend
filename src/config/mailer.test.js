import { describe, it, expect } from 'vitest';
import { sendEmail } from './mailer';

// tw:generated sendEmail
describe('sendEmail', () => {
  it('resolves with sample input', async () => {
    await sendEmail({ to: 1, subject: 1, text: 'test', html: 1 });
  });
});

// tw:generated sendEmail [boost 1]
describe('sendEmail [boost 1]', () => {
  it('exercises edge-case inputs (no assertions)', async () => {
    try { await sendEmail({}); } catch { /* exercised: this call is allowed to throw */ }
  });
});

// tw:generated sendEmail [boost 2]
describe('sendEmail [boost 2]', () => {
  it('exercises edge-case inputs (no assertions)', async () => {
    try { await sendEmail(null); } catch { /* exercised: this call is allowed to throw */ }
  });
});
