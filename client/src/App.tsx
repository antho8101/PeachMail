import { useEffect, useMemo, useState } from "react";
import { ContactsTable } from "./components/ContactsTable";
import { CsvImporter } from "./components/CsvImporter";
import { EmailComposer } from "./components/EmailComposer";
import { LockedFeatureModal, ModesModal } from "./components/ModesModal";
import { PreviewPanel } from "./components/PreviewPanel";
import { SendStatusPanel, type ContactSendStatus } from "./components/SendStatusPanel";
import { SmtpSettings } from "./components/SmtpSettings";
import { renderTemplate } from "./lib/template";
import {
  contactToRecord,
  createExampleContacts,
  getCampaignGuardError,
  type Contact,
  type SendLog,
  type SmtpSettings as SmtpSettingsType
} from "./lib/validation";

const DEFAULT_SUBJECT = "Un petit coucou pour {prenom}";
const DEFAULT_BODY = "Bonjour {prenom},\n\nJe voulais envoyer une note douce à {entreprise}.\n\nÀ bientôt,\nPeachMail";

const DEFAULT_SMTP: SmtpSettingsType = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromName: "PeachMail",
  fromEmail: ""
};

function App() {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [smtp, setSmtp] = useState<SmtpSettingsType>(DEFAULT_SMTP);
  const [delayMs, setDelayMs] = useState(3000);
  const [statuses, setStatuses] = useState<ContactSendStatus[]>([]);
  const [history, setHistory] = useState<SendLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [modesOpen, setModesOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);

  const selectedContact = useMemo(() => {
    return contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0] ?? null;
  }, [contacts, selectedContactId]);

  async function refreshHistory() {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/campaigns/recent");
      const data = (await response.json()) as { logs: SendLog[] };
      setHistory(data.logs);
    } catch {
      setNotice("Impossible de lire l'historique local pour le moment.");
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    refreshHistory();
  }, []);

  function mergeImportedContacts(importedContacts: Contact[]) {
    if (importedContacts.length === 0) {
      setNotice("CSV lu, mais aucun contact utilisable n'a été trouvé.");
      return;
    }

    setContacts((current) => {
      const nextContacts = [...current, ...importedContacts];
      if (!selectedContactId) {
        setSelectedContactId(importedContacts[0].id);
      }
      return nextContacts;
    });
    setNotice(`${importedContacts.length} contact(s) importés. La pile grossit doucement.`);
  }

  function validateForSend(targetContacts: Contact[]) {
    const error = getCampaignGuardError(subject, body, targetContacts, smtp);
    if (error) {
      setNotice(error);
      return false;
    }
    return true;
  }

  async function sendTest() {
    if (!selectedContact || !validateForSend([selectedContact])) return;

    setSending(true);
    setNotice("Envoi du test en cours...");
    try {
      const response = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp, subject, body, contact: selectedContact, to: smtp.fromEmail })
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      setNotice(data.ok ? `Test envoyé à ${smtp.fromEmail}.` : data.error ?? "Le test a trébuché.");
    } catch {
      setNotice("Le serveur local ne répond pas encore.");
    } finally {
      setSending(false);
    }
  }

  async function sendCampaign() {
    if (!validateForSend(contacts)) return;

    setSending(true);
    setStatuses(contacts.map((contact) => ({ email: contact.email, status: "pending" })));
    setNotice("La campagne part doucement...");

    try {
      const response = await fetch("/api/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp, subject, body, contacts, delayMs })
      });
      const data = (await response.json()) as { statuses?: ContactSendStatus[]; error?: string };
      if (!response.ok) {
        setNotice(data.error ?? "La campagne n'a pas pu démarrer.");
      } else {
        setStatuses(data.statuses ?? []);
        setNotice("Campagne terminée. Les statuts sont dans le carnet.");
        refreshHistory();
      }
    } catch {
      setNotice("Le serveur local ne répond pas encore.");
    } finally {
      setSending(false);
    }
  }

  function loadExamples() {
    const examples = createExampleContacts();
    setContacts(examples);
    setSelectedContactId(examples[0].id);
    setNotice("Trois contacts fictifs sont prêts pour jouer.");
  }

  return (
    <main>
      <header className="hero">
        <div>
          <span className="eyebrow">Serveur local MVP</span>
          <h1>PeachMail</h1>
          <p>Une petite machine à écrire pour envoyer des emails personnalisés en masse, sans quitter ton ordinateur.</p>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={() => setModesOpen(true)}>Voir les modes</button>
          <button className="secondary-button" type="button" onClick={() => setLockedOpen(true)}>
            Pause / reprise
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice(null)}>OK</button>
        </div>
      )}

      <div className="app-grid">
        <div className="left-column">
          <EmailComposer subject={subject} body={body} contacts={contacts} onSubjectChange={setSubject} onBodyChange={setBody} />
          <SmtpSettings settings={smtp} delayMs={delayMs} onSettingsChange={setSmtp} onDelayMsChange={setDelayMs} />
        </div>

        <div className="right-column">
          <ContactsTable
            contacts={contacts}
            selectedContactId={selectedContactId}
            onContactsChange={setContacts}
            onSelectedContactIdChange={setSelectedContactId}
          />
          <CsvImporter onImport={mergeImportedContacts} />
          <PreviewPanel
            subject={subject}
            body={body}
            contacts={contacts}
            selectedContactId={selectedContactId}
            onSelectedContactIdChange={setSelectedContactId}
          />
        </div>
      </div>

      <section className="action-bar card">
        <div>
          <strong>Prêt à lancer doucement la campagne ?</strong>
          <p>
            Exemple rendu:{" "}
            {selectedContact ? renderTemplate(subject, contactToRecord(selectedContact)) : "Ajoute un contact ou charge des exemples."}
          </p>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={loadExamples}>Démo express</button>
          <button type="button" disabled={sending} onClick={sendTest}>Envoyer un test</button>
          <button className="primary-button" type="button" disabled={sending} onClick={sendCampaign}>
            Lancer doucement la campagne
          </button>
        </div>
      </section>

      <SendStatusPanel statuses={statuses} history={history} loadingHistory={loadingHistory} />

      <ModesModal open={modesOpen} onClose={() => setModesOpen(false)} />
      <LockedFeatureModal
        open={lockedOpen}
        onClose={() => setLockedOpen(false)}
        onShowModes={() => {
          setLockedOpen(false);
          setModesOpen(true);
        }}
      />
    </main>
  );
}

export default App;
