import type { SmtpSettings as SmtpSettingsType } from "../lib/validation";

type SmtpSettingsProps = {
  settings: SmtpSettingsType;
  delayMs: number;
  onSettingsChange: (settings: SmtpSettingsType) => void;
  onDelayMsChange: (delayMs: number) => void;
};

const PRESETS = {
  gmail: { host: "smtp.gmail.com", port: 465, secure: true },
  outlook: { host: "smtp.office365.com", port: 587, secure: false },
  ovh: { host: "ssl0.ovh.net", port: 465, secure: true },
  custom: { host: "", port: 587, secure: false }
} as const;

export function SmtpSettings({ settings, delayMs, onSettingsChange, onDelayMsChange }: SmtpSettingsProps) {
  function update<K extends keyof SmtpSettingsType>(field: K, value: SmtpSettingsType[K]) {
    onSettingsChange({ ...settings, [field]: value });
  }

  function applyPreset(preset: keyof typeof PRESETS) {
    onSettingsChange({ ...settings, ...PRESETS[preset] });
  }

  return (
    <section className="card smtp-card">
      <div className="section-title compact">
        <span className="sticker sticker-pink">SMTP</span>
        <div>
          <h2>Connexion email</h2>
          <p>Souvent, il faut un mot de passe d'application plutôt que le mot de passe normal.</p>
        </div>
      </div>

      <div className="preset-row">
        <button type="button" onClick={() => applyPreset("gmail")}>Gmail SMTP</button>
        <button type="button" onClick={() => applyPreset("outlook")}>Outlook SMTP</button>
        <button type="button" onClick={() => applyPreset("ovh")}>OVH</button>
        <button className="secondary-button" type="button" onClick={() => applyPreset("custom")}>Custom</button>
      </div>

      <div className="settings-grid">
        <label>
          Host
          <input value={settings.host} onChange={(event) => update("host", event.target.value)} placeholder="smtp.gmail.com" />
        </label>
        <label>
          Port
          <input
            value={settings.port}
            min={1}
            onChange={(event) => update("port", Number(event.target.value))}
            type="number"
          />
        </label>
        <label className="checkbox-label">
          <input checked={settings.secure} onChange={(event) => update("secure", event.target.checked)} type="checkbox" />
          Connexion sécurisée
        </label>
        <label>
          User
          <input value={settings.user} onChange={(event) => update("user", event.target.value)} placeholder="compte@email.com" />
        </label>
        <label>
          Password
          <input
            value={settings.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder="mot de passe d'application"
            type="password"
          />
        </label>
        <label>
          From name
          <input value={settings.fromName} onChange={(event) => update("fromName", event.target.value)} placeholder="PeachMail" />
        </label>
        <label>
          From email
          <input value={settings.fromEmail} onChange={(event) => update("fromEmail", event.target.value)} placeholder="hello@example.com" />
        </label>
        <label>
          Délai entre emails
          <input
            value={Math.round(delayMs / 1000)}
            min={1}
            onChange={(event) => onDelayMsChange(Number(event.target.value) * 1000)}
            type="number"
          />
        </label>
      </div>

      <p className="consent-note">Utilisez cet outil uniquement avec des contacts qui ont accepté de recevoir vos messages.</p>
    </section>
  );
}
