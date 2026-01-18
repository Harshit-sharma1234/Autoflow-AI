'use strict';

import nodemailer from 'nodemailer';
import { createLogger } from '../../utils/logger';

const logger = createLogger('EmailService');

// Email configuration from environment variables
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
};

// Create transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (!transporter) {
        // Check if SMTP credentials are configured
        if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
            logger.warn('SMTP credentials not configured. Emails will be logged but not sent.');
            // Return a mock transporter that just logs
            return {
                sendMail: async (options: nodemailer.SendMailOptions) => {
                    logger.info({
                        to: options.to,
                        subject: options.subject,
                        body: options.text || options.html?.toString().substring(0, 100),
                    }, 'Email would be sent (SMTP not configured)');
                    return {
                        messageId: `mock-${Date.now()}`,
                        response: 'SMTP not configured - email logged only',
                    };
                },
            } as nodemailer.Transporter;
        }

        transporter = nodemailer.createTransport({
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port,
            secure: EMAIL_CONFIG.secure,
            auth: EMAIL_CONFIG.auth,
        });
    }
    return transporter;
}

export interface EmailOptions {
    to: string;
    subject: string;
    body: string;
    html?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send an email using the configured SMTP settings
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
    const { to, subject, body, html } = options;

    try {
        const transport = getTransporter();

        const mailOptions: nodemailer.SendMailOptions = {
            from: EMAIL_CONFIG.from,
            to,
            subject,
            text: body,
            html: html || body,
        };

        logger.info({ to, subject }, 'Sending email');

        const result = await transport.sendMail(mailOptions);

        logger.info({ to, subject, messageId: result.messageId }, 'Email sent successfully');

        return {
            success: true,
            messageId: result.messageId,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ to, subject, error: errorMessage }, 'Failed to send email');

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
        logger.warn('SMTP credentials not configured');
        return false;
    }

    try {
        const transport = getTransporter();
        await transport.verify();
        logger.info('SMTP connection verified');
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ error: errorMessage }, 'SMTP connection verification failed');
        return false;
    }
}

export default {
    sendEmail,
    verifyEmailConnection,
};
