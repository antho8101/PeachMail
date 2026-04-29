import { useI18n } from "../lib/i18n";
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
  const { t } = useI18n();
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
          <h2>{t("smtp.title")}</h2>
        </div>
      </div>

      <div className="preset-row">
        <button type="button" onClick={() => applyPreset("gmail")}>{t("smtp.gmail")}</button>
        <button type="button" onClick={() => applyPreset("outlook")}>{t("smtp.outlook")}</button>
        <button type="button" onClick={() => applyPreset("ovh")}>{t("smtp.ovh")}</button>
        <button className="secondary-button" type="button" onClick={() => applyPreset("custom")}>{t("smtp.custom")}</button>
      </div>

      <div className="settings-grid">
        <label>
          {t("smtp.host")}
          <input value={settings.host} onChange={(event) => update("host", event.target.value)} placeholder="smtp.gmail.com" />
        </label>
        <label>
          {t("smtp.port")}
          <input
            value={settings.port}
            min={1}
            onChange={(event) => update("port", Number(event.target.value))}
            type="number"
          />
        </label>
        <label className="checkbox-label">
          <input checked={settings.secure} onChange={(event) => update("secure", event.target.checked)} type="checkbox" />
          {t("smtp.secure")}
        </label>
        <label>
          {t("smtp.user")}
          <input value={settings.user} onChange={(event) => update("user", event.target.value)} placeholder="compte@email.com" />
        </label>
        <label>
          {t("smtp.password")}
          <input
            value={settings.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder="mot de passe d'application"
            type="password"
          />
        </label>
        <label>
          {t("smtp.fromName")}
          <input value={settings.fromName} onChange={(event) => update("fromName", event.target.value)} placeholder="PeachMail" />
        </label>
        <label>
          {t("smtp.fromEmail")}
          <input value={settings.fromEmail} onChange={(event) => update("fromEmail", event.target.value)} placeholder="hello@example.com" />
        </label>
        <label>
          {t("smtp.delay")}
          <input
            value={Math.round(delayMs / 1000)}
            min={1}
            onChange={(event) => onDelayMsChange(Number(event.target.value) * 1000)}
            type="number"
          />
        </label>
      </div>

      <p className="consent-note">{t("smtp.consent")}</p>
    </section>
  );
}
