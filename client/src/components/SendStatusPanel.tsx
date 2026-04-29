import { useI18n } from "../lib/i18n";
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

export function SendStatusPanel({ statuses, history, loadingHistory }: SendStatusPanelProps) {
  const { t } = useI18n();
  const statusLabels: Record<SendStatus, string> = {
    pending: t("status.pending"),
    sent: t("status.sent"),
    error: t("status.error"),
    blocked: t("status.blocked")
  };

  return (
    <section className="card status-card">
      <div className="section-title compact">
        <span className="sticker sticker-green">Logs</span>
        <div>
          <h2>{t("status.title")}</h2>
        </div>
      </div>

      {statuses.length === 0 ? (
        <p>{t("status.none")}</p>
      ) : (
        <div className="status-list">
          {statuses.map((item) => (
            <div className={`status-pill status-${item.status}`} key={item.email}>
              <span>{item.email}</span>
              <strong>{statusLabels[item.status]}</strong>
              {item.error_message && <small>{item.error_message}</small>}
            </div>
          ))}
        </div>
      )}

      <div className="history-box">
        <h3>{t("status.history")}</h3>
        {loadingHistory ? (
          <p>{t("status.loading")}</p>
        ) : history.length === 0 ? (
          <p>{t("status.empty")}</p>
        ) : (
          <ul>
            {history.map((log) => (
              <li key={log.id}>
                <span>{log.email}</span>
                <strong className={`history-${log.status}`}>{statusLabels[log.status]}</strong>
                <small>{new Date(log.sent_at).toLocaleString("fr-FR")}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
