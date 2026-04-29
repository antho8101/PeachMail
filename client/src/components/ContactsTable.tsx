import { createEmptyContact, createExampleContacts, isValidEmail, type Contact } from "../lib/validation";
import { useI18n } from "../lib/i18n";

type ContactsTableProps = {
  contacts: Contact[];
  selectedContactId: string | null;
  onContactsChange: (contacts: Contact[]) => void;
  onSelectedContactIdChange: (id: string | null) => void;
};

const COLUMNS: Array<keyof Omit<Contact, "id">> = ["email", "prenom", "nom", "entreprise"];

export function ContactsTable({
  contacts,
  selectedContactId,
  onContactsChange,
  onSelectedContactIdChange
}: ContactsTableProps) {
  const { t } = useI18n();
  function updateContact(id: string, field: keyof Omit<Contact, "id">, value: string) {
    onContactsChange(contacts.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact)));
  }

  function addContact() {
    const contact = createEmptyContact();
    onContactsChange([...contacts, contact]);
    onSelectedContactIdChange(contact.id);
  }

  function removeContact(id: string) {
    const nextContacts = contacts.filter((contact) => contact.id !== id);
    onContactsChange(nextContacts);
    if (selectedContactId === id) {
      onSelectedContactIdChange(nextContacts[0]?.id ?? null);
    }
  }

  function fillExamples() {
    const examples = createExampleContacts();
    onContactsChange([...contacts, ...examples]);
    onSelectedContactIdChange(examples[0].id);
  }

  return (
    <section className="card contacts-card">
      <div className="section-title">
        <span className="sticker sticker-blue">2</span>
        <div>
          <h2>{t("contacts.title")}</h2>
        </div>
      </div>

      <div className="button-row">
        <button type="button" onClick={addContact}>{t("contacts.add")}</button>
        <button className="secondary-button" type="button" onClick={fillExamples}>{t("contacts.examples")}</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("contacts.choice")}</th>
              {COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">{t("contacts.empty")}</td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className={selectedContactId === contact.id ? "selected-row" : ""}>
                  <td>
                    <input
                      aria-label={`Sélectionner ${contact.email || contact.prenom || "contact"}`}
                      checked={selectedContactId === contact.id}
                      onChange={() => onSelectedContactIdChange(contact.id)}
                      type="radio"
                    />
                  </td>
                  {COLUMNS.map((column) => (
                    <td key={column}>
                      <input
                        className={column === "email" && contact.email && !isValidEmail(contact.email) ? "input-error" : ""}
                        value={contact[column]}
                        onChange={(event) => updateContact(contact.id, column, event.target.value)}
                        placeholder={column === "email" ? "hello@example.com" : column}
                      />
                    </td>
                  ))}
                  <td>
                    <button className="danger-button small-button" type="button" onClick={() => removeContact(contact.id)}>
                      {t("contacts.delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
