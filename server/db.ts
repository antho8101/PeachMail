import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "peachmail.sqlite"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS send_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );
`);

export type SendStatus = "pending" | "sent" | "error";

export type SendLogRow = {
  id: number;
  campaign_id: number;
  email: string;
  status: SendStatus;
  error_message: string | null;
  sent_at: string;
  subject?: string;
  created_at?: string;
};

export function createCampaign(subject: string, body: string): number {
  const result = db.prepare("INSERT INTO campaigns (subject, body) VALUES (?, ?)").run(subject, body);
  return Number(result.lastInsertRowid);
}

export function insertSendLog(campaignId: number, email: string, status: SendStatus, errorMessage: string | null) {
  db.prepare(
    "INSERT INTO send_logs (campaign_id, email, status, error_message) VALUES (?, ?, ?, ?)"
  ).run(campaignId, email, status, errorMessage);
}

export function getRecentLogs(limit = 20): SendLogRow[] {
  return db
    .prepare(
      `SELECT send_logs.id,
              send_logs.campaign_id,
              send_logs.email,
              send_logs.status,
              send_logs.error_message,
              send_logs.sent_at,
              campaigns.subject,
              campaigns.created_at
       FROM send_logs
       JOIN campaigns ON campaigns.id = send_logs.campaign_id
       ORDER BY send_logs.sent_at DESC
       LIMIT ?`
    )
    .all(limit) as SendLogRow[];
}
