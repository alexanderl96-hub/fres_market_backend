import { describe, it, expect } from 'vitest';
import { sendEmail } from './mailer';

// tw:generated sendEmail
describe('sendEmail', () => {
  it('resolves with sample input', async () => {
    await sendEmail({ to: 1, subject: 1, text: 'test', html: 1 });
  });
});
