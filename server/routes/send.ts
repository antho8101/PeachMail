import { Router } from "express";
import { blockEmail, createCampaign, insertSendLog, isEmailBlocked, type SendStatus } from "../db.js";
import { sendPersonalizedEmail, type Contact, type SmtpSettings } from "../mailer.js";

const MAX_EMAILS_PER_CAMPAIGN = 100;
const DEFAULT_DELAY_MS = 3000;
const DEFAULT_USER_ID = "local";
const UNSUBSCRIBE_BASE_URL = process.env.PEACHMAIL_UNSUBSCRIBE_BASE_URL ?? "http://localhost:5174";

type SendRequestBody = {
  smtp?: SmtpSettings;
  subject?: string;
  body?: string;
  contacts?: Contact[];
  contact?: Contact;
  delayMs?: number;
  to?: string;
  userId?: string;
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

function getUserId(payload: SendRequestBody) {
  return payload.userId?.trim() || DEFAULT_USER_ID;
}

function getUnsubscribeUrl(userId: string, email: string) {
  const params = new URLSearchParams({ userId, email });
  return `${UNSUBSCRIBE_BASE_URL}/api/unsubscribe?${params.toString()}`;
}

sendRouter.get("/unsubscribe", (request, response) => {
  const userId = String(request.query.userId ?? "").trim();
  const email = String(request.query.email ?? "").trim();

  if (!userId || !email) {
    response.status(400).send("Lien de désinscription invalide.");
    return;
  }

  blockEmail(userId, email);
  response
    .status(200)
    .send(`<!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Désinscription PeachMail</title>
          <style>
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #FFD6BA; color: #111111; font-family: "Courier New", monospace; }
            main { max-width: 560px; margin: 24px; padding: 32px; border: 4px solid #111111; border-radius: 28px; background: #FFF3E6; box-shadow: 8px 8px 0 #111111; }
          </style>
        </head>
        <body>
          <main>
            <h1>🍑 Désinscription confirmée</h1>
            <p>${email} ne recevra plus d'emails de cette liste PeachMail.</p>
          </main>
        </body>
      </html>`);
});

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

  const userId = getUserId(payload);

  try {
    await sendPersonalizedEmail({
      smtp,
      subject,
      body,
      contact,
      unsubscribeUrl: getUnsubscribeUrl(userId, contact.email),
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
  const userId = getUserId(payload);

  for (const [index, contact] of contacts.entries()) {
    if (isEmailBlocked(userId, contact.email)) {
      const message = "Contact désinscrit.";
      insertSendLog(campaignId, contact.email, "blocked", message);
      statuses.push({ email: contact.email, status: "blocked", error_message: message });
      continue;
    }

    if (index > 0 && delayMs > 0) {
      await sleep(delayMs);
    }

    try {
      await sendPersonalizedEmail({
        smtp,
        subject,
        body,
        contact,
        unsubscribeUrl: getUnsubscribeUrl(userId, contact.email)
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
