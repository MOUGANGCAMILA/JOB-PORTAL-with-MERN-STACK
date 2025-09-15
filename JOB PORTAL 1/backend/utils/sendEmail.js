const nodemailer = require('nodemailer');

module.exports = async function sendEmail({ to, subject, text, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Support" <no-reply@example.com>',
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`
  });
};
