const nodemailer = require('nodemailer');

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

let transporter = null;

const isMailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
};

/**
 * Branded HTML email: a heading, an intro paragraph, an optional table of
 * label / value rows and an optional button.
 */
const renderEmail = ({ heading, intro, rows = [], button, footer }) => {
  const rowHtml = rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#6E6455;font-size:13px;width:160px;vertical-align:top;border-bottom:1px solid #e6eddf">${escapeHtml(label)}</td>` +
        `<td style="padding:8px 12px;color:#1F2A24;font-size:14px;font-weight:600;border-bottom:1px solid #e6eddf">${escapeHtml(value)}</td></tr>`
    )
    .join('');
  const buttonHtml = button
    ? `<p style="margin:24px 0"><a href="${escapeHtml(button.url)}" style="background:#347745;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(button.label)}</a></p>` +
      `<p style="font-size:12px;color:#6E6455;word-break:break-all">If the button does not work, open this link:<br>${escapeHtml(button.url)}</p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f2f7f0;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f7f0;padding:24px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#347745;color:#ffffff;padding:16px 24px;font-weight:700;font-size:14px;letter-spacing:0.5px">CLIMATE SOLUTIONS</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#1F2A24">${escapeHtml(heading)}</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#1F2A24">${escapeHtml(intro)}</p>
${rowHtml ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0">${rowHtml}</table>` : ''}
${buttonHtml}
${footer ? `<p style="margin:16px 0 0;font-size:12px;color:#6E6455;line-height:1.6">${escapeHtml(footer)}</p>` : ''}
</td></tr></table></td></tr></table></body></html>`;
};

const renderText = ({ heading, intro, rows = [], button, footer }) =>
  [
    heading,
    '',
    intro,
    '',
    ...rows.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '').map(([l, v]) => `${l}: ${v}`),
    button ? `\n${button.label}: ${button.url}` : '',
    footer ? `\n${footer}` : '',
  ].join('\n');

/**
 * Send an email. Resolves to { ok: true } or { ok: false, message } and never throws,
 * so callers can decide how to report a failed delivery.
 */
const sendEmail = async ({ to, subject, replyTo, content }) => {
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[mail] Email is not configured. Would send to ${to}: ${subject}\n${renderText(content)}`);
    }
    return { ok: false, message: 'Email is not set up on the server (SMTP_HOST and MAIL_FROM are missing).' };
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.MAIL_FROM,
      to,
      replyTo: replyTo || process.env.MAIL_REPLY_TO || undefined,
      subject,
      text: renderText(content),
      html: renderEmail(content),
    });
    console.log(`[mail] Sent "${subject}" to ${to} (${info.messageId})`);
    return { ok: true };
  } catch (error) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, error.message);
    return { ok: false, message: 'The email could not be sent. Please try again later.' };
  }
};

module.exports = { sendEmail, isMailConfigured };
