import axios from 'axios';

export interface EmailTemplates {
  passwordReset: {
    subject: string;
    html: (data: { firstName?: string; username: string; resetUrl: string }) => string;
  };
  usernameRecovery: {
    subject: string;
    html: (data: { firstName?: string; username: string; loginUrl: string }) => string;
  };
}

export class EmailService {
  private apiKey: string;
  private domain: string;
  private fromEmail: string;
  private templates: EmailTemplates;

  constructor() {
    // Mailgun configuration
    this.apiKey = process.env['MAILGUN_API_KEY'] || '';
    this.domain = process.env['MAILGUN_DOMAIN'] || '';
    this.fromEmail = process.env['MAILGUN_FROM'] || '';

    // Validate required environment variables
    if (!this.apiKey || !this.domain || !this.fromEmail) {
      console.error('❌ Missing required Mailgun environment variables:');
      console.error('   MAILGUN_API_KEY:', this.apiKey ? '✅ Set' : '❌ Missing');
      console.error('   MAILGUN_DOMAIN:', this.domain ? '✅ Set' : '❌ Missing');
      console.error('   MAILGUN_FROM:', this.fromEmail ? '✅ Set' : '❌ Missing');
      throw new Error('Mailgun configuration incomplete. Please set MAILGUN_API_KEY, MAILGUN_DOMAIN, and MAILGUN_FROM environment variables.');
    }

    console.log('📧 Email service configured for Mailgun REST API');
    console.log(`📧 Domain: ${this.domain}`);
    console.log(`📧 From: ${this.fromEmail}`);

    this.templates = {
      passwordReset: {
        subject: 'Reset Your Password - Thanksgiving Menu Collection',
        html: (data) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { display: inline-block; background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thanksgiving Menu Collection</h1>
              </div>
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hi ${data.firstName || data.username},</p>
                <p>Someone (hopefully you) requested a password reset for your account: <strong>${data.username}</strong></p>
                <p>Click the button below to reset your password:</p>
                <p><a href="${data.resetUrl}" class="button">Reset Password</a></p>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
                <p><strong>This link expires in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email and consider changing your password for security.</p>
                <p>Best regards,<br>Thanksgiving Menu Collection Team</p>
              </div>
              <div class="footer">
                <p>This email was sent from Thanksgiving Menu Collection</p>
              </div>
            </div>
          </body>
          </html>
        `
      },
      usernameRecovery: {
        subject: 'Your Thanksgiving Menu Collection Username',
        html: (data) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Username Recovery</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { display: inline-block; background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thanksgiving Menu Collection</h1>
              </div>
              <div class="content">
                <h2>Username Recovery</h2>
                <p>Hi ${data.firstName || data.username},</p>
                <p>You requested your username for your Thanksgiving Menu Collection account.</p>
                <p>Your username is: <strong>${data.username}</strong></p>
                <p>Click the button below to login:</p>
                <p><a href="${data.loginUrl}" class="button">Login Now</a></p>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="${data.loginUrl}">${data.loginUrl}</a></p>
                <p>Best regards,<br>Thanksgiving Menu Collection Team</p>
              </div>
              <div class="footer">
                <p>This email was sent from Thanksgiving Menu Collection</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    };
  }

  private async sendMailgunEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const url = `https://api.mailgun.net/v3/${this.domain}/messages`;
      
      const formData = new URLSearchParams();
      formData.append('from', this.fromEmail!);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('html', html);

      // Use environment variables directly to avoid any potential logging
      const apiKey = process.env['MAILGUN_API_KEY'];
      
      await axios.post(url, formData, {
        auth: {
          username: 'api',
          password: apiKey!
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log(`Email sent successfully to: ${to}`);
    } catch (error) {
      console.error('❌ Error sending email via Mailgun:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, data: { firstName?: string; username: string; resetUrl: string }): Promise<void> {
    const template = this.templates.passwordReset;
    
    try {
      await this.sendMailgunEmail(email, template.subject, template.html(data));
      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }

  async sendUsernameRecovery(email: string, data: { firstName?: string; username: string; loginUrl: string }): Promise<void> {
    const template = this.templates.usernameRecovery;
    
    try {
      await this.sendMailgunEmail(email, template.subject, template.html(data));
      console.log(`Username recovery email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send username recovery email:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test the API connection without actually sending
      const url = `https://api.mailgun.net/v3/${this.domain}/messages`;
      
      await axios.get(url, {
        auth: {
          username: 'api',
          password: this.apiKey
        }
      });
      
      console.log('✅ Mailgun API connection verified');
      return true;
    } catch (error) {
      console.error('❌ Mailgun API connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();