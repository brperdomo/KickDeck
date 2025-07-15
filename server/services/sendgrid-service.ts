/**
 * SendGrid Service for Email Communication
 * 
 * This service handles sending emails through SendGrid API with both
 * regular email content and dynamic templates.
 */

import { MailService } from '@sendgrid/mail';

// Initialize SendGrid client
const mailService = new MailService();

if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY environment variable not found');
}

export interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters
 * @returns Promise<boolean> Success status
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    const message: any = {
      to: params.to,
      from: params.from,
    };

    // Use dynamic template if provided
    if (params.templateId) {
      message.templateId = params.templateId;
      message.dynamicTemplateData = params.dynamicTemplateData || {};
    } else {
      // Use regular email content
      message.subject = params.subject;
      message.text = params.text || 'Please view this email in a compatible email client.';
      message.html = params.html || '<p>Please view this email in a compatible email client.</p>';
    }

    await mailService.send(message);
    console.log(`SendGrid: Email sent to ${params.to}`);
    return true;

  } catch (error: any) {
    console.error('SendGrid error:', error);
    
    // Log detailed error for debugging
    if (error.response && error.response.body) {
      console.error('SendGrid response error:', JSON.stringify(error.response.body, null, 2));
    }
    
    return false;
  }
}