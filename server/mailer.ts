import nodemailer from "nodemailer";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

export type Contact = {
  email: string;
  prenom?: string;
  nom?: string;
  entreprise?: string;
  [key: string]: string | undefined;
};

const PEACHMAIL_URL = "https://peachmail.app";

export function renderTemplate(template: string, contact: Record<string, string | undefined>): string {
  return template.replace(/\{([a-zA-Z0-9_\-À-ÿ]+)\}/g, (_match, key: string) => contact[key] ?? "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtmlBody(body: string, unsubscribeUrl: string) {
  const htmlBody = escapeHtml(body).replace(/\r?\n/g, "<br>");

  return `
    <div style="font-family: Courier New, monospace; line-height: 1.5; color: #111111;">
      <div>${htmlBody}</div>
      <hr style="margin: 28px 0 16px; border: 0; border-top: 2px solid #111111;" />
      <p style="margin: 0 0 12px; font-size: 13px;">
        Envoyé avec 🍑 <a href="${PEACHMAIL_URL}" style="color: #111111; font-weight: 700;">PeachMail</a>
      </p>
      <a href="${unsubscribeUrl}" style="display: inline-block; padding: 10px 14px; border: 2px solid #111111; border-radius: 14px; background: #FFD166; color: #111111; font-weight: 700; text-decoration: none;">
        Se désinscrire
      </a>
    </div>
  `;
}

function buildTextBody(body: string, unsubscribeUrl: string) {
  return `${body}

--
Envoyé avec 🍑 PeachMail
${PEACHMAIL_URL}

Se désinscrire:
${unsubscribeUrl}`;
}

export function createTransport(smtp: SmtpSettings) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.password
    }
  });
}

export async function sendPersonalizedEmail(params: {
  smtp: SmtpSettings;
  subject: string;
  body: string;
  contact: Contact;
  unsubscribeUrl: string;
  to?: string;
}) {
  const transporter = createTransport(params.smtp);
  const from = params.smtp.fromName
    ? `"${params.smtp.fromName.replace(/"/g, "'")}" <${params.smtp.fromEmail}>`
    : params.smtp.fromEmail;

  const renderedBody = renderTemplate(params.body, params.contact);

  return transporter.sendMail({
    from,
    to: params.to ?? params.contact.email,
    subject: renderTemplate(params.subject, params.contact),
    text: buildTextBody(renderedBody, params.unsubscribeUrl),
    html: buildHtmlBody(renderedBody, params.unsubscribeUrl)
  });
}
