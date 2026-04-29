export type ContactRecord = Record<string, string>;

export const CORE_VARIABLES = ["prenom", "nom", "email", "entreprise"] as const;

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{([a-zA-Z0-9_\-À-ÿ]+)\}/g) ?? [];
  return Array.from(new Set(matches.map((match) => match.slice(1, -1).trim()).filter(Boolean)));
}

export function renderTemplate(template: string, contact: ContactRecord): string {
  return template.replace(/\{([a-zA-Z0-9_\-À-ÿ]+)\}/g, (_match, key: string) => {
    return contact[key] ?? "";
  });
}

export function findMissingVariables(variables: string[], contacts: ContactRecord[]): string[] {
  if (contacts.length === 0) {
    return variables.filter((variable) => !CORE_VARIABLES.includes(variable as (typeof CORE_VARIABLES)[number]));
  }

  return variables.filter((variable) => contacts.every((contact) => !(variable in contact)));
}
