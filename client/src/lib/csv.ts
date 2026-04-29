import Papa from "papaparse";
import type { Contact } from "./validation";

type CsvRow = Record<string, string>;

const COLUMN_ALIASES = {
  email: ["email", "mail", "e-mail", "courriel"],
  prenom: ["prenom", "prénom", "firstname", "first_name", "first name"],
  nom: ["nom", "lastname", "last_name", "last name"],
  entreprise: ["entreprise", "company", "societe", "société", "organization"]
} as const;

export type CsvMapping = Record<keyof typeof COLUMN_ALIASES, string | null>;

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectCsvMapping(headers: string[]): CsvMapping {
  const normalizedHeaders = headers.map((header) => ({ raw: header, normalized: normalize(header) }));

  return Object.fromEntries(
    Object.entries(COLUMN_ALIASES).map(([field, aliases]) => {
      const match = normalizedHeaders.find((header) => aliases.map(normalize).includes(header.normalized));
      return [field, match?.raw ?? null];
    })
  ) as CsvMapping;
}

export function rowsToContacts(rows: CsvRow[], mapping: CsvMapping): Contact[] {
  return rows
    .map((row) => ({
      id: crypto.randomUUID(),
      email: mapping.email ? row[mapping.email]?.trim() ?? "" : "",
      prenom: mapping.prenom ? row[mapping.prenom]?.trim() ?? "" : "",
      nom: mapping.nom ? row[mapping.nom]?.trim() ?? "" : "",
      entreprise: mapping.entreprise ? row[mapping.entreprise]?.trim() ?? "" : ""
    }))
    .filter((contact) => contact.email || contact.prenom || contact.nom || contact.entreprise);
}

export function parseCsvFile(file: File): Promise<{ headers: string[]; rows: CsvRow[]; mapping: CsvMapping; contacts: Contact[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        const mapping = detectCsvMapping(headers);
        resolve({
          headers,
          rows: result.data,
          mapping,
          contacts: rowsToContacts(result.data, mapping)
        });
      },
      error: (error) => reject(error)
    });
  });
}
