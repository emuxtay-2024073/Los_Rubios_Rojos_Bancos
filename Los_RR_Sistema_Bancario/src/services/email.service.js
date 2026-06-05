import nodemailer from 'nodemailer';

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }

    throw new Error('SMTP configuration missing. Define SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in .env');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendOrLogEmail = async ({ to, subject, text, html, devLink }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[Email dev] SMTP no configurado. Enlace generado para ${to}: ${devLink}`);
    return { skipped: true, devLink };
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Los Rubios Rojos Banco" <no-reply@losrubiosrojosbanco.com>';

  return transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html,
  });
};

export const sendVerificationEmail = async (user, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const safeUsername = escapeHtml(user.username);
  const safeVerifyLink = escapeHtml(verifyLink);

  const html = `
    <div style="margin:0;padding:0;background:#071A33;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071A33;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#F8FAFC;border-radius:18px;overflow:hidden;border:1px solid #D4AF37;box-shadow:0 22px 70px rgba(0,0,0,.28);">
              <tr>
                <td style="background:#002D62;padding:0;color:#ffffff;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding:30px 30px 26px;">
                        <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:800;color:#D4AF37;">Los Rubios Rojos Banco</div>
                        <h1 style="margin:12px 0 0;font-size:34px;line-height:1.08;font-weight:900;">Activa tu acceso bancario</h1>
                        <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#DDEBFF;">Confirma tu correo para proteger tu cuenta y habilitar operaciones dentro del sistema bancario.</p>
                      </td>
                      <td width="132" align="center" style="padding:20px 24px 20px 0;">
                        <div style="width:104px;height:104px;border-radius:50%;background:#D4AF37;color:#002D62;border:7px solid #EEF4FF;text-align:center;font-weight:900;line-height:1;">
                          <div style="font-size:30px;padding-top:22px;">RR</div>
                          <div style="font-size:10px;letter-spacing:2px;margin-top:7px;">BANCO</div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px;">
                  <div style="height:18px;background:repeating-linear-gradient(90deg,#D4AF37 0,#D4AF37 16px,#F8FAFC 16px,#F8FAFC 30px,#0B5CAD 30px,#0B5CAD 36px);border-radius:0 0 16px 16px;"></div>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 28px 10px;color:#0F172A;">
                  <p style="margin:0 0 18px;font-size:18px;line-height:1.65;">Hola <strong>${safeUsername}</strong>,</p>
                  <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#334155;">
                    Tu cuenta fue creada correctamente. Para mantener seguro tu acceso, necesitamos validar este correo antes de permitir el inicio de sesion y las operaciones bancarias.
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-collapse:separate;border-spacing:0;">
                    <tr>
                      <td style="background:#FFFFFF;border:2px dashed #D4AF37;border-radius:16px;padding:20px;">
                        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#002D62;font-weight:800;">Verificacion segura</div>
                        <div style="margin-top:8px;font-size:15px;color:#475569;">Enlace valido por 24 horas</div>
                        <div style="margin-top:14px;height:1px;background:repeating-linear-gradient(90deg,#D4AF37 0,#D4AF37 10px,transparent 10px,transparent 18px);"></div>
                        <div style="margin-top:18px;text-align:center;">
                          <a href="${safeVerifyLink}" style="display:inline-block;background:#002D62;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:15px 30px;border-radius:999px;border:3px solid #001B3D;">
                            Verificar mi correo
                          </a>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:22px 0 8px;font-size:14px;color:#64748B;">Si el boton no abre, copia este enlace:</p>
                  <p style="margin:0;word-break:break-all;font-size:13px;line-height:1.6;color:#0B5CAD;">${safeVerifyLink}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px 30px;">
                  <div style="background:#0B1F3A;color:#DDEBFF;border-radius:14px;padding:16px 18px;font-size:13px;line-height:1.55;border-left:5px solid #D4AF37;">
                    Si no solicitaste esta cuenta, puedes ignorar este correo. Nadie podra operar con esta cuenta sin verificar el enlace.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return sendOrLogEmail({
    to: user.email,
    subject: 'Los Rubios Rojos Banco - verifica tu cuenta',
    text: `Hola ${user.username},

Bienvenido a Los Rubios Rojos Banco.

Confirma tu correo para activar tu cuenta bancaria:
${verifyLink}

Este enlace es valido por 24 horas.

Si no creaste esta cuenta, puedes ignorar este correo.

Los Rubios Rojos Banco`,
    html,
    devLink: verifyLink,
  });
};
