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

export function renderTemplate(template: string, contact: Record<string, string | undefined>): string {
  return template.replace(/\{([a-zA-Z0-9_\-À-ÿ]+)\}/g, (_match, key: string) => contact[key] ?? "");
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
  to?: string;
}) {
  const transporter = createTransport(params.smtp);
  const from = params.smtp.fromName
    ? `"${params.smtp.fromName.replace(/"/g, "'")}" <${params.smtp.fromEmail}>`
    : params.smtp.fromEmail;

  return transporter.sendMail({
    from,
    to: params.to ?? params.contact.email,
    subject: renderTemplate(params.subject, params.contact),
    text: renderTemplate(params.body, params.contact)
  });
}
