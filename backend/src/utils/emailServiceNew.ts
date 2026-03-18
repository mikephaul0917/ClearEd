import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"E-Clearance System" <${process.env.EMAIL_FROM || 'noreply@eclearance.system'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmail(emailOptions: EmailOptions[]): Promise<void> {
    const promises = emailOptions.map(options => this.sendEmail(options));

    try {
      await Promise.all(promises);
      console.log(`Bulk emails sent: ${emailOptions.length} emails`);
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(to: string, verificationLink: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 8px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 8px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">E-Clearance</div>
            <h2>Email Verification</h2>
          </div>
          <div class="content">
            <p>Thank you for registering with E-Clearance. Please click the button below to verify your email address.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button">Verify Email</a>
            </p>
            <p><small>This link will expire in 24 hours.</small></p>
          </div>
          <div class="footer">
            <p>If you did not request this verification, please ignore this email.</p>
            <p>&copy; 2024 E-Clearance System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: 'Verify Your E-Clearance Email',
      html
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 8px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .content { background-color: #ffffff; padding: 30px; border-radius: 8px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">E-Clearance</div>
            <h2>Password Reset</h2>
          </div>
          <div class="content">
            <p>You have requested to reset your password. Click the button below to set a new password.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p><small>This link will expire in 1 hour.</small></p>
          </div>
          <div class="footer">
            <p>If you did not request this password reset, please ignore this email.</p>
            <p>&copy; 2024 E-Clearance System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: 'Reset Your E-Clearance Password',
      html
    });
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const testOptions = {
        to: process.env.EMAIL_USER || '',
        subject: 'E-Clearance Email Test',
        html: '<p>This is a test email to verify the email configuration is working correctly.</p>'
      };

      await this.sendEmail(testOptions);
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

export default EmailService;
