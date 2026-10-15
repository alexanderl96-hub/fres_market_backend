import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import crypto from 'node:crypto';
import { sendEmail } from '../config/mailer.js';
// import { use } from 'react';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

function makeToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, name: user.name, created_at: user.created_at },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at};
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    const user = result.rows[0];

    return res.status(201).json({ user: publicUser(user), token: makeToken(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }

    const result = await pool.query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    return res.json({ user: publicUser(user), token: makeToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Account not found.' });
    return res.json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});


router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    // Always return the same response, even if the account is absent.
    const genericResponse = {
      message: 'If an account matches that email, recovery instructions will be sent.',
    };

    const result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (user) {
      const token = await createActionToken(
        user.id,
        'reset_password',
        15
      );

      const resetUrl = new URL(
        '/reset-password',
        process.env.CLIENT_ORIGIN
      );

      resetUrl.searchParams.set('token', token);

      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset your Food Store password',
          text: `Use this link within 15 minutes to reset your password:\n${resetUrl.href}\n\nIf you did not request this, ignore this email.`,
          html: `<p>We received a password reset request.</p>
            <p><a href="${resetUrl.href}">Reset your password</a></p>
            <p>This link expires in 15 minutes. If you did not request it, ignore this email.</p>`,
        });
      } catch (emailError) {
        // Invalidate the token if email delivery fails.
        await pool.query(
          `UPDATE auth_action_tokens
           SET used_at = NOW()
           WHERE token_hash = $1 AND used_at IS NULL`,
          [hashToken(token)]
        );

        throw emailError;
      }
    }

    return res.json(genericResponse);
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', authLimiter, async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { token, password } = req.body;

    if (
      typeof token !== 'string' ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        error: 'Provide a valid reset token and a password between 8 and 72 characters.',
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `SELECT id, user_id
       FROM auth_action_tokens
       WHERE token_hash = $1
         AND purpose = 'reset_password'
         AND used_at IS NULL
         AND expires_at > NOW()
       FOR UPDATE`,
      [hashToken(token)]
    );

    const action = result.rows[0];

    if (!action) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'This reset link is invalid or expired. Request a new one.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, action.user_id]
    );

    // Consume all outstanding password reset tokens for this user.
    await client.query(
      `UPDATE auth_action_tokens
       SET used_at = NOW()
       WHERE user_id = $1
         AND purpose = 'reset_password'
         AND used_at IS NULL`,
      [action.user_id]
    );

    await client.query('COMMIT');

    return res.json({
      message: 'Password reset successfully. Please sign in again.',
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

router.post('/recover-account-email', authLimiter, async (req, res, next) => {
    const genericMessage =
      'If an account matches that verified recovery email, an email will be sent shortly.';

    try {
      const recoveryEmail =
        typeof req.body?.recoveryEmail === 'string'
          ? req.body.recoveryEmail.trim().toLowerCase()
          : '';

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail) ||
        recoveryEmail.length > 255
      ) {
        return res.status(400).json({
          error: 'Enter a valid recovery email address.',
        });
      }

      const result = await pool.query(
        `SELECT email
         FROM users
         WHERE LOWER(recovery_email) = $1
           AND recovery_email_verified_at IS NOT NULL
         LIMIT 1`,
        [recoveryEmail]
      );

      // Always return the same response when no verified match exists.
      if (result.rows.length === 0) {
        return res.status(200).json({ message: genericMessage });
      }

      const accountEmail = result.rows[0].email;

      // Send the account email only to its verified recovery address.
      try {
        await sendEmail({
          to: recoveryEmail,
          subject: 'Your Food Store account email',
          text: `You requested to recover your Food Store account email.\n\nYour account email is: ${accountEmail}\n\nIf you did not make this request, you can ignore this message.`,
          html: `
            <p>You requested to recover your Food Store account email.</p>
            <p>Your account email is: <strong>${accountEmail}</strong></p>
            <p>If you did not make this request, you can ignore this message.</p>
          `,
        });
      } catch (emailError) {
        // Do not reveal account existence through the API response.
        console.error(
          'Account email recovery message could not be sent:',
          emailError.message
        );
      }

      return res.status(200).json({ message: genericMessage });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/recovery-email/request', requireAuth, async (req, res, next) => {
  try {
    const recoveryEmail = typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail) ||
        recoveryEmail.length > 255) {
      return res.status(400).json({
        error: 'Enter a valid recovery email address.',
      });
    }

    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [req.user.sub]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (recoveryEmail === user.email) {
      return res.status(400).json({
        error: 'Use an alternate email address.',
      });
    }

    const token = await createActionToken(
      user.id,
      'verify_recovery_email',
      15
    );

    const verifyUrl = new URL(
      '/verify-recovery-email',
      process.env.CLIENT_ORIGIN
    );
    verifyUrl.searchParams.set('token', token);

    try {
      await sendEmail({
        to: recoveryEmail,
        subject: 'Verify your Food Store recovery email',
        text: `Verify your recovery email within 15 minutes:\n${verifyUrl.href}`,
        html: `<p>Verify your recovery email:</p>
          <p><a href="${verifyUrl.href}">Verify email address</a></p>
          <p>This link expires in 15 minutes.</p>`,
      });

      // Save the pending address only after delivery succeeds.
      await pool.query(
        `UPDATE users
         SET recovery_email = $1,
             recovery_email_verified_at = NULL
         WHERE id = $2`,
        [recoveryEmail, user.id]
      );
    } catch (error) {
      await pool.query(
        `UPDATE auth_action_tokens SET used_at = NOW()
         WHERE token_hash = $1 AND used_at IS NULL`,
        [hashToken(token)]
      );
      throw error;
    }

    return res.json({
      message: 'If email delivery succeeds, check your alternate address for a verification link.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/recovery-email/verify', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { token } = req.body;

    if (typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid verification link.' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `SELECT id, user_id
       FROM auth_action_tokens
       WHERE token_hash = $1
         AND purpose = 'verify_recovery_email'
         AND used_at IS NULL
         AND expires_at > NOW()
       FOR UPDATE`,
      [hashToken(token)]
    );

    const action = result.rows[0];

    if (!action) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'This verification link is invalid or expired.',
      });
    }

    await client.query(
      `UPDATE users
       SET recovery_email_verified_at = NOW()
       WHERE id = $1 AND recovery_email IS NOT NULL`,
      [action.user_id]
    );

    await client.query(
      `UPDATE auth_action_tokens
       SET used_at = NOW()
       WHERE user_id = $1
         AND purpose = 'verify_recovery_email'
         AND used_at IS NULL`,
      [action.user_id]
    );

    await client.query('COMMIT');

    return res.json({ message: 'Recovery email verified successfully.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      newPassword.length < 8 ||
      newPassword.length > 72
    ) {
      return res.status(400).json({
        error: 'Enter your current password and a new password between 8 and 72 characters.',
      });
    }

    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user.sub]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({
        error: 'Your current password is incorrect.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );

    return res.json({
      message: 'Password changed successfully. Please sign in again on other devices.',
    });
  } catch (error) {
    next(error);
  }
});


export default router;


function createSecureToken() {
  const token = crypto.randomBytes(32).toString('hex');

  return {
    token,
    tokenHash: crypto.createHash('sha256')
      .update(token)
      .digest('hex'),
  };
}

async function createActionToken(userId, purpose, minutes) {
  const { token, tokenHash } = createSecureToken();

  await pool.query(
    `UPDATE auth_action_tokens
     SET used_at = NOW()
     WHERE user_id = $1
       AND purpose = $2
       AND used_at IS NULL`,
    [userId, purpose]
  );

  await pool.query(
    `INSERT INTO auth_action_tokens
       (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 minute'))`,
    [userId, tokenHash, purpose, minutes]
  );

  return token;
}

function hashToken(token) {
  return crypto.createHash('sha256')
    .update(token)
    .digest('hex');
}