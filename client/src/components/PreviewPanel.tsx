import { useI18n } from "../lib/i18n";
import { extractVariables, renderTemplate } from "../lib/template";
import { contactToRecord, type Contact } from "../lib/validation";

type PreviewPanelProps = {
  subject: string;
  body: string;
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectedContactIdChange: (id: string | null) => void;
};

const FAKE_CONTACT: Contact = {
  id: "fake",
  email: "tony@example.com",
  prenom: "Tony",
  nom: "Pêche",
  entreprise: "Atelier Soleil"
};

export function PreviewPanel({
  subject,
  body,
  contacts,
  selectedContactId,
  onSelectedContactIdChange
}: PreviewPanelProps) {
  const { t } = useI18n();
  const selectedIndex = Math.max(0, contacts.findIndex((contact) => contact.id === selectedContactId));
  const contact = contacts[selectedIndex] ?? FAKE_CONTACT;
  const renderedSubject = renderTemplate(subject || "Une petite nouvelle pour {prenom}", contactToRecord(contact));
  const renderedBody = renderTemplate(body || "Bonjour {prenom},\n\nBienvenue chez {entreprise}.", contactToRecord(contact));
  const missingForContact = extractVariables(`${subject} ${body}`).filter((variable) => !(variable in contactToRecord(contact)));

  function move(delta: number) {
    if (contacts.length === 0) return;
    const nextIndex = (selectedIndex + delta + contacts.length) % contacts.length;
    onSelectedContactIdChange(contacts[nextIndex].id);
  }

  return (
    <section className="card preview-card">
      <div className="section-title">
        <span className="sticker sticker-green">3</span>
        <div>
          <h2>{t("preview.title")}</h2>
        </div>
      </div>

      <div className="preview-nav">
        <button className="secondary-button" type="button" disabled={contacts.length < 2} onClick={() => move(-1)}>
          {t("preview.prev")}
        </button>
        <span>
          {contacts.length === 0 ? t("preview.demo") : `${selectedIndex + 1} / ${contacts.length}`}
        </span>
        <button className="secondary-button" type="button" disabled={contacts.length < 2} onClick={() => move(1)}>
          {t("preview.next")}
        </button>
      </div>

      <div className="mail-preview">
        <span className="preview-label">{t("preview.subject")}</span>
        <h3>{renderedSubject || t("preview.emptySubject")}</h3>
        <span className="preview-label">{t("preview.body")}</span>
        <pre>{renderedBody || t("preview.emptyBody")}</pre>
      </div>

      {missingForContact.length > 0 && (
        <p className="soft-warning">
          {t("preview.missing", { variables: missingForContact.map((variable) => `{${variable}}`).join(", ") })}
        </p>
      )}
    </section>
  );
}
