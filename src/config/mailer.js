
import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

let transporter;

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
    throw new Error('Email service is not configured.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 465),
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  return getTransporter().sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}