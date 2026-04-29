import { Router } from "express";
import { createCampaign, insertSendLog, type SendStatus } from "../db.js";
import { sendPersonalizedEmail, type Contact, type SmtpSettings } from "../mailer.js";

const MAX_EMAILS_PER_CAMPAIGN = 100;
const DEFAULT_DELAY_MS = 3000;

type SendRequestBody = {
  smtp?: SmtpSettings;
  subject?: string;
  body?: string;
  contacts?: Contact[];
  contact?: Contact;
  delayMs?: number;
  to?: string;
};

type ContactSendStatus = {
  email: string;
  status: SendStatus;
  error_message: string | null;
};

export const sendRouter = Router();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasSmtp(smtp: SmtpSettings | undefined): smtp is SmtpSettings {
  return Boolean(smtp?.host && smtp.port && smtp.user && smtp.password && smtp.fromEmail);
}

function getBaseError(payload: SendRequestBody): string | null {
  if (!payload.subject?.trim()) return "Sujet vide.";
  if (!payload.body?.trim()) return "Message vide.";
  if (!hasSmtp(payload.smtp)) return "Configuration SMTP incomplète.";
  return null;
}

sendRouter.post("/send-test", async (request, response) => {
  const payload = request.body as SendRequestBody;
  const baseError = getBaseError(payload);

  if (baseError) {
    response.status(400).json({ ok: false, error: baseError });
    return;
  }

  if (!payload.contact?.email) {
    response.status(400).json({ ok: false, error: "Contact de test manquant." });
    return;
  }

  const { smtp, subject, body, contact } = payload;
  if (!smtp || !subject || !body || !contact) {
    response.status(400).json({ ok: false, error: "Requête de test incomplète." });
    return;
  }

  try {
    await sendPersonalizedEmail({
      smtp,
      subject,
      body,
      contact,
      to: payload.to || smtp.fromEmail
    });
    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Erreur SMTP inconnue." });
  }
});

sendRouter.post("/send-campaign", async (request, response) => {
  const payload = request.body as SendRequestBody;
  const baseError = getBaseError(payload);

  if (baseError) {
    response.status(400).json({ error: baseError });
    return;
  }

  const contacts = payload.contacts ?? [];
  if (contacts.length === 0) {
    response.status(400).json({ error: "Aucun contact à envoyer." });
    return;
  }

  if (contacts.length > MAX_EMAILS_PER_CAMPAIGN) {
    response.status(400).json({ error: `Limite MVP: ${MAX_EMAILS_PER_CAMPAIGN} emails par campagne.` });
    return;
  }

  const { smtp, subject, body } = payload;
  if (!smtp || !subject || !body) {
    response.status(400).json({ error: "Requête de campagne incomplète." });
    return;
  }

  const delayMs = Math.max(0, Number(payload.delayMs ?? DEFAULT_DELAY_MS));
  const campaignId = createCampaign(subject, body);
  const statuses: ContactSendStatus[] = [];

  for (const [index, contact] of contacts.entries()) {
    if (index > 0 && delayMs > 0) {
      await sleep(delayMs);
    }

    try {
      await sendPersonalizedEmail({
        smtp,
        subject,
        body,
        contact
      });
      insertSendLog(campaignId, contact.email, "sent", null);
      statuses.push({ email: contact.email, status: "sent", error_message: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur SMTP inconnue.";
      insertSendLog(campaignId, contact.email, "error", message);
      statuses.push({ email: contact.email, status: "error", error_message: message });
    }
  }

  response.json({ campaignId, statuses });
});
