const RESEND_ENDPOINT = 'https://api.resend.com/emails';

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

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendWithResend({ to, subject, html, text }) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new MailError(`Resend respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
}

/**
 * Envía el código de verificación. Sin RESEND_API_KEY no falla: lo imprime en
 * la consola del backend para poder probar el flujo en desarrollo.
 */
export async function sendVerificationCode(email, code, { username } = {}) {
  const subject = `${code} es tu código de verificación · Matching`;

  if (!isMailConfigured()) {
    console.warn(
      `\n⚠ RESEND_API_KEY no configurada — correo NO enviado.\n` +
        `  Código de verificación para ${email}: ${code}\n`,
    );
    return { delivered: false, reason: 'mail_not_configured' };
  }

  await sendWithResend({
    to: email,
    subject,
    text: `Hola${username ? ` ${username}` : ''}, tu código de verificación de Matching es ${code}. Caduca en 10 minutos.`,
    html: verificationTemplate(code, username),
  });

  return { delivered: true };
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
