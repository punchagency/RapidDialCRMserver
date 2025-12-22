import nodemailer from 'nodemailer';

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

class EmailService {
  private transporter;
  private from: string;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.example.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    this.from = process.env.SMTP_FROM || `no-reply@${host.replace(/^smtp\./, '')}`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendMail(input: MailInput) {
    const emailTitle = this.from.split('@')[0];

    await this.transporter.sendMail({
      from: `${emailTitle} <${this.from}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }

  async sendInviteEmail(to: string, name: string, link: string) {
    const subject = 'You have been invited to QuantumPunch CRM';
    const html = `
      <p>Hi ${name || 'there'},</p>
      <p>You have been invited to join QuantumPunch CRM.</p>
      <p>Please set your password here:</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not expect this invite, you can ignore this email.</p>
    `;
    await this.sendMail({ to, subject, html });
  }

  async sendPasswordResetEmail(to: string, name: string, link: string) {
    const subject = 'Reset your QuantumPunch password';
    const html = `
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password.</p>
      <p>You can set a new password here:</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `;
    await this.sendMail({ to, subject, html });
  }
}

let emailService: EmailService | null = null;

export const getEmailService = () => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};

