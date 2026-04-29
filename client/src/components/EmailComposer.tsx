import { useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
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
  const { t } = useI18n();
  const variables = extractVariables(`${subject} ${body}`);
  const missingVariables = findMissingVariables(variables, contacts);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  function insertVariable(variable: string) {
    const token = `{${variable}}`;
    const target = activeField === "subject" ? subjectRef.current : bodyRef.current;
    const value = activeField === "subject" ? subject : body;
    const update = activeField === "subject" ? onSubjectChange : onBodyChange;
    const start = target?.selectionStart ?? value.length;
    const end = target?.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${token}${value.slice(end)}`;

    update(nextValue);
    requestAnimationFrame(() => {
      target?.focus();
      target?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <section className="card composer-card">
      <div className="section-title">
        <span className="sticker sticker-pink">1</span>
        <div>
          <h2>{t("composer.title")}</h2>
        </div>
      </div>

      <label>
        {t("composer.subject")}
        <input
          ref={subjectRef}
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          onFocus={() => setActiveField("subject")}
          placeholder={t("composer.subjectPlaceholder")}
        />
      </label>

      <label>
        {t("composer.body")}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          onFocus={() => setActiveField("body")}
          placeholder={t("composer.bodyPlaceholder")}
          rows={11}
        />
      </label>

      <div className="variable-row">
        <span>{t("composer.variables")}</span>
        {CORE_VARIABLES.map((variable) => (
          <button className="chip-button" key={variable} type="button" onClick={() => insertVariable(variable)}>
            {"{" + variable + "}"}
          </button>
        ))}
      </div>

      <div className="detected-box">
        <strong>{t("composer.detected")}</strong>
        {variables.length === 0 ? (
          <p>{t("composer.none")}</p>
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
            {t("composer.missing", { variables: missingVariables.map((variable) => `{${variable}}`).join(", ") })}
          </p>
        )}
      </div>
    </section>
  );
}
