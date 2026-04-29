import { useState } from "react";
import { parseCsvFile, type CsvMapping } from "../lib/csv";
import type { Contact } from "../lib/validation";

type CsvImporterProps = {
  onImport: (contacts: Contact[]) => void;
};

export function CsvImporter({ onImport }: CsvImporterProps) {
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
      setError("Impossible de lire ce CSV. Essaie avec un fichier plus simple.");
    }
  }

  return (
    <section className="card import-card">
      <div className="section-title compact">
        <span className="sticker sticker-yellow">CSV</span>
        <div>
          <h3>Importer une liste</h3>
          <p>Colonnes reconnues: email, prénom, nom, entreprise.</p>
        </div>
      </div>

      <label className="file-drop">
        <input accept=".csv,text/csv" type="file" onChange={(event) => handleFile(event.target.files?.[0])} />
        <span>Choisir un CSV</span>
      </label>

      {mapping && (
        <div className="mapping-box">
          <strong>Mapping détecté</strong>
          <p>
            email → {mapping.email ?? "?"} · prénom → {mapping.prenom ?? "?"} · nom → {mapping.nom ?? "?"} · entreprise →{" "}
            {mapping.entreprise ?? "?"}
          </p>
          <p>{lastCount} contact(s) ajoutés à la pile.</p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
