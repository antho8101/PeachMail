import type { SendLog, SendStatus } from "../lib/validation";

export type ContactSendStatus = {
  email: string;
  status: SendStatus;
  error_message?: string | null;
};

type SendStatusPanelProps = {
  statuses: ContactSendStatus[];
  history: SendLog[];
  loadingHistory: boolean;
};

const STATUS_LABELS: Record<SendStatus, string> = {
  pending: "en attente",
  sent: "envoyé",
  error: "erreur"
};

export function SendStatusPanel({ statuses, history, loadingHistory }: SendStatusPanelProps) {
  return (
    <section className="card status-card">
      <div className="section-title compact">
        <span className="sticker sticker-green">Logs</span>
        <div>
          <h2>Statuts d'envoi</h2>
          <p>Pause café entre deux emails...</p>
        </div>
      </div>

      {statuses.length === 0 ? (
        <p>Aucune campagne lancée dans cette session.</p>
      ) : (
        <div className="status-list">
          {statuses.map((item) => (
            <div className={`status-pill status-${item.status}`} key={item.email}>
              <span>{item.email}</span>
              <strong>{STATUS_LABELS[item.status]}</strong>
              {item.error_message && <small>{item.error_message}</small>}
            </div>
          ))}
        </div>
      )}

      <div className="history-box">
        <h3>Historique récent</h3>
        {loadingHistory ? (
          <p>Je fouille les derniers courriers...</p>
        ) : history.length === 0 ? (
          <p>Rien dans le carnet pour l'instant.</p>
        ) : (
          <ul>
            {history.map((log) => (
              <li key={log.id}>
                <span>{log.email}</span>
                <strong className={`history-${log.status}`}>{STATUS_LABELS[log.status]}</strong>
                <small>{new Date(log.sent_at).toLocaleString("fr-FR")}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
