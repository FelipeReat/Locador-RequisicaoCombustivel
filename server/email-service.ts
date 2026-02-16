import nodemailer from 'nodemailer';

// Configuração do transportador de e-mail
// Em produção, estas variáveis devem vir de variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

export async function sendPasswordChangeNotification(email: string, username: string) {
  try {
    // Se não houver configuração de e-mail real, apenas logamos
    if (!process.env.SMTP_HOST) {
      console.log(`[Email Mock] Enviando notificação de alteração de senha para ${email} (Usuário: ${username})`);
      console.log(`[Email Mock] Conteúdo: Sua senha foi alterada pelo administrador.`);
      return true;
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Sistema Locador" <noreply@locador.com>',
      to: email,
      subject: 'Aviso de Alteração de Senha - Sistema Locador',
      text: `Olá ${username},\n\nSua senha de acesso ao Sistema Locador foi alterada por um administrador.\n\nUtilize a nova senha fornecida pelo administrador para acessar o sistema.\n\nSe você não solicitou esta alteração ou desconhece o motivo, entre em contato com o suporte imediatamente.\n\nAtenciosamente,\nEquipe do Sistema`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Alteração de Senha</h2>
          <p>Olá <strong>${username}</strong>,</p>
          <p>Sua senha de acesso ao <strong>Sistema Locador</strong> foi alterada por um administrador.</p>
          <p>Utilize a nova senha fornecida pelo administrador para acessar o sistema.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Se você não solicitou esta alteração ou desconhece o motivo, entre em contato com o suporte imediatamente.</p>
        </div>
      `,
    });

    console.log(`E-mail enviado: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return false;
  }
}
