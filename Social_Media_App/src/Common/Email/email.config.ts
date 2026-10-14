import { createTransport } from "nodemailer";
import { Mail_PASS, Mail_USER } from "../../config/config.service.js";
import type { Attachment } from "nodemailer/lib/mailer/index.js";

const transporter = createTransport({
  service: "gmail", // Shortcut for Gmail's SMTP settings - see Well-Known Services
  auth: {
    user: Mail_USER,
    pass: Mail_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
}) {
  // Send an email using async/await
  const info = await transporter.sendMail({
    from: `"Route " <${Mail_USER}>`, // sender address
    to, // list of receivers
    subject,
    text, // Plain-text version of the message
    html, // HTML version of the message
    attachments,
  });

  console.log("Message sent:", info.messageId);
}
