import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
  tls: { ciphers: 'SSLv3' },
});

/* ── Envia código de verificação ── */
export async function enviarCodigoVerificacao(destinatario, nome, codigo) {
  await transporter.sendMail({
    from: `"Atende+" <${process.env.EMAIL_FROM}>`,
    to: destinatario,
    subject: 'Seu código de verificação - Atende+',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f5f4fe;font-family:-apple-system,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4fe;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6c5ce7,#a855f7);padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">Atende<span style="color:#c4b5fd">+</span></h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Sistema de gestão para saúde</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 8px;font-size:16px;color:#111827;">Olá, <strong>${nome}</strong>!</p>
                  <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                    Use o código abaixo para confirmar seu e-mail e criar sua conta no Atende+.
                  </p>

                  <!-- Código -->
                  <div style="background:#f5f3ff;border:2px dashed #7c3aed;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#7c3aed;">Código de verificação</p>
                    <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:0.15em;color:#111827;">${codigo}</p>
                  </div>

                  <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">⏱ Este código expira em <strong>15 minutos</strong>.</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;">Se você não solicitou este código, pode ignorar este e-mail com segurança.</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Atende+ • Todos os direitos reservados.</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

/* ── Envia link de redefinição de senha ── */
export async function enviarRedefinicaoSenha(destinatario, nome, link) {
  await transporter.sendMail({
    from: `"Atende+" <${process.env.EMAIL_FROM}>`,
    to: destinatario,
    subject: 'Redefinição de senha - Atende+',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f5f4fe;font-family:-apple-system,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4fe;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <tr>
                <td style="background:linear-gradient(135deg,#6c5ce7,#a855f7);padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Atende<span style="color:#c4b5fd">+</span></h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Sistema de gestão para saúde</p>
                </td>
              </tr>

              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 8px;font-size:16px;color:#111827;">Olá, <strong>${nome}</strong>!</p>
                  <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                    Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
                  </p>

                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#6c5ce7,#a855f7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
                      Redefinir senha →
                    </a>
                  </div>

                  <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">⏱ Este link expira em <strong>30 minutos</strong>.</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;">Se você não solicitou isso, ignore este e-mail — sua senha continua a mesma.</p>
                </td>
              </tr>

              <tr>
                <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Atende+ • Todos os direitos reservados.</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
