import { logger } from '../utils/logger.js';
import sgMail from '@sendgrid/mail';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

class EmailService {
    private isConfigured: boolean = false;

    constructor() {
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            this.isConfigured = true;
            logger.info('EmailService initialized with SendGrid');
        } else {
            logger.warn('EmailService: SENDGRID_API_KEY not found. Emails will be logged to console only.');
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        const { to, subject, text, html } = options;

        if (!this.isConfigured) {
            logger.info(`[MOCK EMAIL SERVICE] To: ${to} | Subject: ${subject}`);
            logger.info(`[MOCK EMAIL BODY] ${text}`);
            return true; // Pretend success
        }

        try {
            const msg = {
                to,
                from: process.env.EMAIL_FROM || 'noreply@buildpro.app', // Verified sender required
                subject,
                text,
                html: html || text,
            };

            await sgMail.send(msg);
            logger.info(`Email sent to ${to}`);
            return true;
        } catch (error) {
            logger.error('Failed to send email:', error);
            return false;
        }
    }

    async sendInvitation(to: string, role: string, companyName: string, inviteLink: string) {
        const subject = `You've been invited to join ${companyName} on BuildPro`;
        const text = `
            Hello,

            You have been invited to join ${companyName} as a ${role}.
            
            Click the link below to accept your invitation:
            ${inviteLink}

            If you did not expect this invitation, please ignore this email.
        `;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to BuildPro</h2>
                <p>Hello,</p>
                <p>You have been invited to join <strong>${companyName}</strong> as a <strong>${role}</strong>.</p>
                <br/>
                <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
                <br/><br/>
                <p>If the button doesn't work, copy and paste this link:</p>
                <p>${inviteLink}</p>
            </div>
        `;

        return this.sendEmail({ to, subject, text, html });
    }
}

export const emailService = new EmailService();
