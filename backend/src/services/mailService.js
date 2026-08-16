const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

// Remitente de pruebas de Resend: funciona sin verificar dominio, pero solo
// entrega al correo dueño de la cuenta de Resend.
const DEFAULT_FROM = 'Matching <onboarding@resend.dev>';

export class MailError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'MailError';
    this.status = status;
  }
}

/**
 * Brevo tiene prioridad porque permite verificar una única dirección sin
 * poseer un dominio; Resend queda como alternativa para cuando haya uno.
 */
export function activeProvider() {
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  return null;
}

export function isMailConfigured() {
  return activeProvider() !== null;
}

/** Acepta tanto `Nombre <correo@dominio>` como un correo suelto. */
function parseFrom() {
  const raw = (process.env.MAIL_FROM || DEFAULT_FROM).trim();
  const match = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) return { name: match[1] || 'Matching', email: match[2] };
  return { name: 'Matching', email: raw };
}

async function post(endpoint, headers, body, provider) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new MailError(`${provider} respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
}

function sendWithResend({ to, subject, html, text }) {
  const from = parseFrom();
  return post(
    RESEND_ENDPOINT,
    { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    { from: `${from.name} <${from.email}>`, to: [to], subject, html, text },
    'Resend',
  );
}

function sendWithBrevo({ to, subject, html, text }) {
  const from = parseFrom();
  return post(
    BREVO_ENDPOINT,
    { 'api-key': process.env.BREVO_API_KEY, accept: 'application/json' },
    {
      sender: { name: from.name, email: from.email },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    },
    'Brevo',
  );
}

/**
 * Envía el código de verificación. Sin proveedor configurado no falla: lo
 * imprime en la consola del backend para poder probar el flujo en desarrollo.
 */
export async function sendVerificationCode(email, code, { username } = {}) {
  const provider = activeProvider();
  const payload = {
    to: email,
    subject: `${code} es tu código de verificación · Matching`,
    text: `Hola${username ? ` ${username}` : ''}, tu código de verificación de Matching es ${code}. Caduca en 10 minutos.`,
    html: verificationTemplate(code, username),
  };

  if (!provider) {
    console.warn(
      `\n⚠ Sin proveedor de correo (BREVO_API_KEY o RESEND_API_KEY) — correo NO enviado.\n` +
        `  Código de verificación para ${email}: ${code}\n`,
    );
    return { delivered: false, reason: 'mail_not_configured' };
  }

  if (provider === 'brevo') await sendWithBrevo(payload);
  else await sendWithResend(payload);

  return { delivered: true, provider };
}

function verificationTemplate(code, username) {
  const greeting = username ? `Hola ${escapeHtml(username)},` : 'Hola,';
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:32px 16px;background:#0b1220;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#101827;border:1px solid rgba(255,255,255,.1);border-radius:14px;">
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;color:#ffffff;">Confirma tu correo</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#94a3b8;">
            ${greeting} usa este código para activar tu cuenta de Matching.
          </p>
          <div style="margin:0 0 24px;padding:18px;text-align:center;background:#0b1220;border:1px solid rgba(129,140,248,.35);border-radius:12px;">
            <span style="font-size:34px;letter-spacing:10px;font-weight:700;color:#a5b4fc;">${code}</span>
          </div>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#94a3b8;">
            El código caduca en <strong style="color:#e2e8f0;">10 minutos</strong>.
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
            Si no creaste esta cuenta, ignora este correo.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}
