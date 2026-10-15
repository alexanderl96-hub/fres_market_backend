import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
  } = process.env;

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

  return { transporter, MAIL_FROM };
}

export async function sendEmail({ to, subject, text, html }) {
  const { transporter, MAIL_FROM } = getTransporter();

  return transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

