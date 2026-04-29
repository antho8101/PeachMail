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
          <h2>Aperçu live</h2>
          <p>Aperçu pour {contact.prenom || contact.email || "Tony"}.</p>
        </div>
      </div>

      <div className="preview-nav">
        <button className="secondary-button" type="button" disabled={contacts.length < 2} onClick={() => move(-1)}>
          Précédent
        </button>
        <span>
          {contacts.length === 0 ? "Données fictives" : `${selectedIndex + 1} / ${contacts.length}`}
        </span>
        <button className="secondary-button" type="button" disabled={contacts.length < 2} onClick={() => move(1)}>
          Suivant
        </button>
      </div>

      <div className="mail-preview">
        <span className="preview-label">Sujet rendu</span>
        <h3>{renderedSubject || "Sujet vide"}</h3>
        <span className="preview-label">Message rendu</span>
        <pre>{renderedBody || "Message vide"}</pre>
      </div>

      {missingForContact.length > 0 && (
        <p className="soft-warning">
          Ces variables seront remplacées par du vide pour ce contact: {missingForContact.map((variable) => `{${variable}}`).join(", ")}
        </p>
      )}
    </section>
  );
}
