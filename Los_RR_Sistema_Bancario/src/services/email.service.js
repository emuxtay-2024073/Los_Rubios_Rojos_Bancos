export const sendVerificationEmail = async (user, token) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyPath = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM || `no-reply@${process.env.APP_DOMAIN || 'localhost'}`;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('Email service: SMTP no configurado. Envío omitido. Dev link disponible para pruebas.');
    return { skipped: true, devLink: verifyPath };
  }

  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10) || 587,
      secure: String(smtpPort) === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = process.env.EMAIL_VERIFY_SUBJECT || 'Verifica tu correo - Sistema Bancario';
    const html = `
      <p>Hola ${user.username || user.email},</p>
      <p>Gracias por registrarte. Para verificar tu correo haz click en el siguiente enlace:</p>
      <p><a href="${verifyPath}">Verificar correo</a></p>
      <p>Si no solicitaste esto, ignora este mensaje.</p>
    `;

    const info = await transporter.sendMail({
      from: emailFrom,
      to: user.email,
      subject,
      html,
      text: `${subject}\n\nVisita: ${verifyPath}`,
    });

    console.log('Email enviado:', info.messageId);
    return { skipped: false };
  } catch (err) {
    console.error('Error enviando email de verificación:', err?.message || err);
    return { skipped: true, devLink: verifyPath };
  }
};
