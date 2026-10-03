import type { QuoteFields } from "./schema";

/**
 * The quote backend sends email through this interface, so the provider can
 * change without touching the route. v1 ships Resend (REST, no SDK) and a
 * console fallback for local development.
 */

export interface QuoteAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface QuoteRequest extends QuoteFields {
  attachment?: QuoteAttachment;
  receivedAt: Date;
}

export interface QuoteMailer {
  send(request: QuoteRequest): Promise<void>;
}

/** Resend caps total message size; larger files are listed but not attached. */
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function summaryRows(q: QuoteRequest): [string, string][] {
  return [
    ["Name", q.name],
    ["Contact", q.contact],
    ["Category", q.category],
    ["Material", q.material],
    ["Quantity", String(q.quantity)],
    ["Colour", q.colour || "-"],
    ["Notes", q.notes || "-"],
    [
      "File",
      q.attachment ? `${q.attachment.filename} (${(q.attachment.size / 1024 / 1024).toFixed(2)} MB)` : "None",
    ],
  ];
}

export class ResendMailer implements QuoteMailer {
  constructor(
    private apiKey: string,
    private from: string,
    private to: string,
  ) {}

  async send(q: QuoteRequest) {
    const rows = summaryRows(q);
    const attach = q.attachment && q.attachment.size <= MAX_ATTACHMENT_BYTES;
    const note =
      q.attachment && !attach
        ? "<p><strong>The file was too large to attach. Ask the customer for a download link.</strong></p>"
        : "";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [this.to],
        reply_to: q.contact.includes("@") ? q.contact : undefined,
        subject: `Quote request: ${q.category} from ${q.name}`,
        html: `<h2>New quote request</h2>${note}<table cellpadding="6">${rows
          .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
          .join("")}</table>`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        attachments: attach
          ? [{ filename: q.attachment!.filename, content: q.attachment!.content.toString("base64") }]
          : undefined,
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

export class ConsoleMailer implements QuoteMailer {
  async send(q: QuoteRequest) {
    console.info("[quote] New quote request (no email provider configured):\n" + summaryRows(q).map(([k, v]) => `  ${k}: ${v}`).join("\n"));
  }
}

export function getMailer(): QuoteMailer {
  const { RESEND_API_KEY, QUOTE_FROM_EMAIL, QUOTE_TO_EMAIL } = process.env;
  if (RESEND_API_KEY && QUOTE_FROM_EMAIL && QUOTE_TO_EMAIL) {
    return new ResendMailer(RESEND_API_KEY, QUOTE_FROM_EMAIL, QUOTE_TO_EMAIL);
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[quote] RESEND_API_KEY, QUOTE_FROM_EMAIL or QUOTE_TO_EMAIL missing; quotes are only logged.");
  }
  return new ConsoleMailer();
}
