import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { ContactsTable } from "./components/ContactsTable";
import { CsvImporter } from "./components/CsvImporter";
import { EmailComposer } from "./components/EmailComposer";
import { LockedFeatureModal, ModesModal } from "./components/ModesModal";
import { PreviewPanel } from "./components/PreviewPanel";
import { SendStatusPanel, type ContactSendStatus } from "./components/SendStatusPanel";
import { SmtpSettings } from "./components/SmtpSettings";
import { auth, firebaseApp } from "./lib/firebase";
import { useI18n } from "./lib/i18n";
import { renderTemplate } from "./lib/template";
import {
  contactToRecord,
  createExampleContacts,
  getCampaignGuardError,
  MAX_EMAILS_PER_CAMPAIGN,
  type Contact,
  type SendLog,
  type SmtpSettings as SmtpSettingsType
} from "./lib/validation";

const DEFAULT_SUBJECT = "Un petit coucou pour {prenom}";
const DEFAULT_BODY = "Bonjour {prenom},\n\nUn mot pour {entreprise}.\n\nPeachMail";

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
  const { t } = useI18n();
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const selectedContact = useMemo(() => {
    return contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0] ?? null;
  }, [contacts, selectedContactId]);
  const validContactCount = contacts.filter((contact) => contact.email.includes("@")).length;
  const smtpReady = Boolean(smtp.host && smtp.port && smtp.user && smtp.password && smtp.fromEmail);
  const firebaseReady = Boolean(firebaseApp.options.projectId);

  async function refreshHistory() {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/campaigns/recent");
      const data = (await response.json()) as { logs: SendLog[] };
      setHistory(data.logs);
    } catch {
      setNotice(t("notice.historyError"));
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    refreshHistory();
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    setNotice(t("notice.signedOut"));
  }

  function mergeImportedContacts(importedContacts: Contact[]) {
    if (importedContacts.length === 0) {
      setNotice(t("notice.noContactsFound"));
      return;
    }

    setContacts((current) => {
      const nextContacts = [...current, ...importedContacts];
      if (!selectedContactId) {
        setSelectedContactId(importedContacts[0].id);
      }
      return nextContacts;
    });
    setNotice(t("notice.imported", { count: importedContacts.length }));
  }

  function validateForSend(targetContacts: Contact[]) {
    const error = getCampaignGuardError(subject, body, targetContacts, smtp, {
      subject: t("guard.subject"),
      body: t("guard.body"),
      contact: t("guard.contact"),
      limit: t("guard.limit", { max: MAX_EMAILS_PER_CAMPAIGN }),
      email: t("guard.email"),
      smtp: t("guard.smtp"),
      from: t("guard.from")
    });
    if (error) {
      setNotice(error);
      return false;
    }
    return true;
  }

  async function sendTest() {
    if (!selectedContact || !validateForSend([selectedContact])) return;

    setSending(true);
    setNotice(t("notice.testRunning"));
    try {
      const response = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp, subject, body, contact: selectedContact, to: smtp.fromEmail, userId: user?.uid ?? "local" })
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      setNotice(data.ok ? t("notice.testSent") : data.error ?? t("notice.testFailed"));
    } catch {
      setNotice(t("notice.serverDown"));
    } finally {
      setSending(false);
    }
  }

  async function sendCampaign() {
    if (!validateForSend(contacts)) return;

    setSending(true);
    setStatuses(contacts.map((contact) => ({ email: contact.email, status: "pending" })));
    setNotice(t("notice.campaignStarted"));

    try {
      const response = await fetch("/api/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp, subject, body, contacts, delayMs, userId: user?.uid ?? "local" })
      });
      const data = (await response.json()) as { statuses?: ContactSendStatus[]; error?: string };
      if (!response.ok) {
        setNotice(data.error ?? t("notice.campaignBlocked"));
      } else {
        setStatuses(data.statuses ?? []);
        setNotice(t("notice.campaignDone"));
        refreshHistory();
      }
    } catch {
      setNotice(t("notice.serverDown"));
    } finally {
      setSending(false);
    }
  }

  function loadExamples() {
    const examples = createExampleContacts();
    setContacts(examples);
    setSelectedContactId(examples[0].id);
    setNotice(t("notice.demoLoaded"));
  }

  if (authLoading) {
    return (
      <main className="loading-page">
        <section className="card loading-card">
          <span className="sticker sticker-yellow">PM</span>
          <h1>{t("loading.title")}</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <main>
      <div className="dashboard-shell">
        <aside className="side-menu card" aria-label="Navigation PeachMail">
          <a className="brand-lockup" href="#top">
            <span className="brand-mark" aria-hidden="true">🍑</span>
            <span>
              <strong>PeachMail</strong>
              <small>{t("app.local")}</small>
            </span>
          </a>

          <nav className="menu-links">
            <a href="#composer">{t("app.composer")}</a>
            <a href="#contacts">{t("app.contacts")}</a>
            <a href="#settings">{t("app.settings")}</a>
            <a href="#send">{t("app.send")}</a>
            <a href="#history">{t("app.history")}</a>
          </nav>

          <div className="menu-summary">
            <span>{user.email ?? "Compte Google"}</span>
            <span>{contacts.length} contacts</span>
            <span>{smtpReady ? t("app.smtpOk") : t("app.smtpMissing")}</span>
            <span>{firebaseReady ? t("app.cloudOk") : t("app.cloudMissing")}</span>
            <span>{delayMs / 1000}s</span>
          </div>

          <div className="menu-actions">
            <button type="button" onClick={() => setModesOpen(true)}>{t("app.modes")}</button>
            <button className="secondary-button" type="button" onClick={() => setLockedOpen(true)}>
              {t("app.pauseResume")}
            </button>
            <button className="danger-button" type="button" onClick={handleSignOut}>
              {t("app.signOut")}
            </button>
          </div>
        </aside>

        <div className="dashboard-content" id="top">
          <header className="hero hero-compact">
            <div>
              <span className="eyebrow">{t("app.typewriter")}</span>
              <h1>PeachMail</h1>
              <p>{user.displayName || user.email || t("app.connected")}</p>
            </div>
            <div className="dashboard-metrics" aria-label="Résumé de campagne">
              <div className="metric-card metric-pink">
                <strong>{contacts.length}</strong>
                <span>{t("app.metric.contacts")}</span>
              </div>
              <div className="metric-card metric-green">
                <strong>{validContactCount}</strong>
                <span>{t("app.metric.ready")}</span>
              </div>
              <div className="metric-card metric-blue">
                <strong>{smtpReady ? "OK" : "..."}</strong>
                <span>{t("app.metric.smtp")}</span>
              </div>
              <div className="metric-card metric-yellow">
                <strong>{firebaseReady ? "OK" : "..."}</strong>
                <span>{t("app.metric.cloud")}</span>
              </div>
            </div>
          </header>

          {notice && (
            <div className="notice" role="status">
              {notice}
              <button type="button" onClick={() => setNotice(null)}>OK</button>
            </div>
          )}

          <section className="dashboard-section" id="composer">
            <div className="section-heading">
              <span className="eyebrow">{t("app.step1")}</span>
              <h2>{t("app.composer")}</h2>
            </div>
            <div className="two-panel-grid">
              <EmailComposer subject={subject} body={body} contacts={contacts} onSubjectChange={setSubject} onBodyChange={setBody} />
              <PreviewPanel
                subject={subject}
                body={body}
                contacts={contacts}
                selectedContactId={selectedContactId}
                onSelectedContactIdChange={setSelectedContactId}
              />
            </div>
          </section>

          <section className="dashboard-section" id="contacts">
            <div className="section-heading">
              <span className="eyebrow">{t("app.step2")}</span>
              <h2>{t("app.contacts")}</h2>
            </div>
            <div className="contacts-layout">
              <ContactsTable
                contacts={contacts}
                selectedContactId={selectedContactId}
                onContactsChange={setContacts}
                onSelectedContactIdChange={setSelectedContactId}
              />
              <CsvImporter onImport={mergeImportedContacts} />
            </div>
          </section>

          <section className="dashboard-section" id="settings">
            <div className="section-heading">
              <span className="eyebrow">{t("app.step3")}</span>
              <h2>{t("app.settings")}</h2>
            </div>
            <SmtpSettings settings={smtp} delayMs={delayMs} onSettingsChange={setSmtp} onDelayMsChange={setDelayMs} />
          </section>

          <section className="dashboard-section" id="send">
            <div className="section-heading">
              <span className="eyebrow">{t("app.step4")}</span>
              <h2>{t("app.send")}</h2>
            </div>

            <section className="action-bar card">
              <div>
                <strong>{selectedContact ? renderTemplate(subject, contactToRecord(selectedContact)) : t("app.ready")}</strong>
              </div>
              <div className="button-row">
                <button className="secondary-button" type="button" onClick={loadExamples}>{t("app.demo")}</button>
                <button type="button" disabled={sending} onClick={sendTest}>{t("app.sendTest")}</button>
                <button className="primary-button" type="button" disabled={sending} onClick={sendCampaign}>
                  {t("app.launch")}
                </button>
              </div>
            </section>
          </section>

          <section className="dashboard-section" id="history">
            <SendStatusPanel statuses={statuses} history={history} loadingHistory={loadingHistory} />
          </section>
        </div>
      </div>

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
