export const sendVerificationEmail = async (user, token) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyPath = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || `no-reply@${process.env.APP_DOMAIN || 'localhost'}`;

  console.log('=== Email Service Debug ===');
  console.log('SMTP Host:', smtpHost ? 'CONFIGURED' : 'NOT CONFIGURED');
  console.log('SMTP Port:', smtpPort || 'NOT CONFIGURED');
  console.log('SMTP User:', smtpUser ? 'CONFIGURED' : 'NOT CONFIGURED');
  console.log('SMTP Pass:', smtpPass ? 'CONFIGURED' : 'NOT CONFIGURED');
  console.log('Email From:', emailFrom);
  console.log('User Email:', user.email);
  console.log('========================');

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('Email service: SMTP no configurado. Envío omitido. Dev link disponible para pruebas.');
    console.warn('Dev link:', verifyPath);
    return { skipped: true, devLink: verifyPath };
  }

  try {
    const nodemailer = await import('nodemailer');

    console.log('Creando transporter con nodemailer...');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10) || 587,
      secure: String(smtpPort) === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('Verificando conexión SMTP...');
    await transporter.verify();
    console.log('Conexión SMTP verificada exitosamente');

    const subject = process.env.EMAIL_VERIFY_SUBJECT || 'Verifica tu correo - Sistema Bancario';
    const html = `
      <p>Hola ${user.username || user.email},</p>
      <p>Gracias por registrarte. Para verificar tu correo haz click en el siguiente enlace:</p>
      <p><a href="${verifyPath}">Verificar correo</a></p>
      <p>Si no solicitaste esto, ignora este mensaje.</p>
    `;

    console.log('Enviando email a:', user.email);
    const info = await transporter.sendMail({
      from: emailFrom,
      to: user.email,
      subject,
      html,
      text: `${subject}\n\nVisita: ${verifyPath}`,
    });

    console.log('Email enviado exitosamente:', info.messageId);
    console.log('Respuesta del servidor:', info.response);
    return { skipped: false };
  } catch (err) {
    console.error('Error enviando email de verificación:', err?.message || err);
    console.error('Error completo:', err);
    return { skipped: true, devLink: verifyPath, error: err?.message };
  }
};
