import { CORE_VARIABLES, extractVariables, findMissingVariables } from "../lib/template";
import type { Contact } from "../lib/validation";

type EmailComposerProps = {
  subject: string;
  body: string;
  contacts: Contact[];
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
};

export function EmailComposer({ subject, body, contacts, onSubjectChange, onBodyChange }: EmailComposerProps) {
  const variables = extractVariables(`${subject} ${body}`);
  const missingVariables = findMissingVariables(variables, contacts);

  function insertVariable(variable: string) {
    onBodyChange(`${body}${body.endsWith(" ") || body.length === 0 ? "" : " "}{${variable}}`);
  }

  return (
    <section className="card composer-card">
      <div className="section-title">
        <span className="sticker sticker-pink">1</span>
        <div>
          <h2>La lettre</h2>
          <p>Écris ton message, puis glisse quelques variables personnalisées.</p>
        </div>
      </div>

      <label>
        Sujet
        <input
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          placeholder="Ex: Une petite nouvelle pour {prenom}"
        />
      </label>

      <label>
        Message
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder={"Bonjour {prenom},\n\nUn mot doux pour {entreprise}..."}
          rows={11}
        />
      </label>

      <div className="variable-row">
        <span>Insérer variable</span>
        {CORE_VARIABLES.map((variable) => (
          <button className="chip-button" key={variable} type="button" onClick={() => insertVariable(variable)}>
            {"{" + variable + "}"}
          </button>
        ))}
      </div>

      <div className="detected-box">
        <strong>Variables détectées</strong>
        {variables.length === 0 ? (
          <p>Aucune variable pour l'instant. La machine attend son petit carburant.</p>
        ) : (
          <div className="chip-list">
            {variables.map((variable) => (
              <span className="chip" key={variable}>
                {variable}
              </span>
            ))}
          </div>
        )}
        {missingVariables.length > 0 && (
          <p className="soft-warning">
            Ce champ n'existe pas encore dans tes contacts: {missingVariables.map((variable) => `{${variable}}`).join(", ")}
          </p>
        )}
      </div>
    </section>
  );
}
