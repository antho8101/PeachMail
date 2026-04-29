import { useState } from "react";
import { parseCsvFile, type CsvMapping } from "../lib/csv";
import { useI18n } from "../lib/i18n";
import type { Contact } from "../lib/validation";

type CsvImporterProps = {
  onImport: (contacts: Contact[]) => void;
};

export function CsvImporter({ onImport }: CsvImporterProps) {
  const { t } = useI18n();
  const [mapping, setMapping] = useState<CsvMapping | null>(null);
  const [lastCount, setLastCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    try {
      const result = await parseCsvFile(file);
      setMapping(result.mapping);
      setLastCount(result.contacts.length);
      onImport(result.contacts);
    } catch {
      setError(t("csv.error"));
    }
  }

  return (
    <section className="card import-card">
      <div className="section-title compact">
        <span className="sticker sticker-yellow">CSV</span>
        <div>
          <h3>{t("csv.title")}</h3>
        </div>
      </div>

      <label className="file-drop">
        <input accept=".csv,text/csv" type="file" onChange={(event) => handleFile(event.target.files?.[0])} />
        <span>{t("csv.choose")}</span>
      </label>

      {mapping && (
        <div className="mapping-box">
          <strong>{t("csv.mapping")}</strong>
          <p>
            email → {mapping.email ?? "?"} · prénom → {mapping.prenom ?? "?"} · nom → {mapping.nom ?? "?"} · entreprise →{" "}
            {mapping.entreprise ?? "?"}
          </p>
          <p>{t("csv.added", { count: lastCount })}</p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
