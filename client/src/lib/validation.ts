export type Contact = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  entreprise: string;
};

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

export type SendStatus = "pending" | "sent" | "error";

export type SendLog = {
  id: number;
  campaign_id: number;
  email: string;
  status: SendStatus;
  error_message: string | null;
  sent_at: string;
  subject?: string;
  created_at?: string;
};

export const MAX_EMAILS_PER_CAMPAIGN = 100;

export function createEmptyContact(): Contact {
  return {
    id: crypto.randomUUID(),
    email: "",
    prenom: "",
    nom: "",
    entreprise: ""
  };
}

export function createExampleContacts(): Contact[] {
  return [
    { id: crypto.randomUUID(), email: "tony@example.com", prenom: "Tony", nom: "Pêche", entreprise: "Atelier Soleil" },
    { id: crypto.randomUUID(), email: "mina@example.com", prenom: "Mina", nom: "Rose", entreprise: "Studio Corail" },
    { id: crypto.randomUUID(), email: "leo@example.com", prenom: "Léo", nom: "Bleu", entreprise: "Maison Nuage" }
  ];
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function contactToRecord(contact: Contact): Record<string, string> {
  return {
    email: contact.email,
    prenom: contact.prenom,
    nom: contact.nom,
    entreprise: contact.entreprise
  };
}

export function getCampaignGuardError(
  subject: string,
  body: string,
  contacts: Contact[],
  smtp: SmtpSettings
): string | null {
  if (!subject.trim()) return "Ajoute un sujet avant de faire partir les petits courriers.";
  if (!body.trim()) return "Écris un message avant de lancer la machine.";
  if (contacts.length === 0) return "Ajoute au moins un contact avant l'envoi.";
  if (contacts.length > MAX_EMAILS_PER_CAMPAIGN) return `Limite MVP: ${MAX_EMAILS_PER_CAMPAIGN} emails par campagne.`;
  if (contacts.some((contact) => !isValidEmail(contact.email))) return "Un ou plusieurs emails ont une drôle de forme.";
  if (!smtp.host || !smtp.port || !smtp.user || !smtp.password || !smtp.fromEmail) {
    return "Complète la connexion email avant d'envoyer.";
  }
  if (!isValidEmail(smtp.fromEmail)) return "L'adresse expéditeur n'est pas valide.";
  return null;
}
