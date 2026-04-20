import nodemailer from 'nodemailer';

// Email options interface
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// Cache the transporter for connection pooling
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Max simultaneous connections
    maxMessages: 100, // Max messages per connection before closing and reopening
  };

  transporter = nodemailer.createTransport(config);
  return transporter;
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // We keep a small log to know it's attempting to send
    console.log(`📧 SENDING EMAIL TO: ${options.to} | SUBJECT: ${options.subject}`);
    
    // Use nodemailer in production or configured local environments
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP_USER or SMTP_PASS is missing in .env file. Falling back to mock email dump:');
        console.log(`📋 SUBJECT: ${options.subject}`);
        console.log(`📄 CONTENT: ${options.html.substring(0, 100)}...`);
        return;
    }

    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || `"E-Clearance System" <${process.env.SMTP_USER}>`,
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const currentTransporter = getTransporter();
    await currentTransporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to ${options.to}`);
    
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

// Send verification email for institution request
export const sendVerificationEmail = async (
  email: string, 
  token: string, 
  institutionName: string
): Promise<void> => {
  let baseUrl = process.env.FRONTEND_URL || 'https://clear-ed-8u77.vercel.app';
  // Remove trailing slash if present to prevent double slashes in links
  baseUrl = baseUrl.replace(/\/$/, '');
  
  const verificationUrl = `${baseUrl}/verify-institution/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F172A;">Verify Your Institution Request</h2>
      <p>Dear Administrator,</p>
      <p>Thank you for requesting access to E-Clearance for <strong>${institutionName}</strong>.</p>
      <p>Please click the button below to verify your email address and complete your request:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #0F172A; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">
        If you didn't request this access, please ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `Verify Your Institution Request - ${institutionName}`,
    html,
    text: `Please verify your email address for your institution request: ${verificationUrl}`
  });
};

/**
 * Send notification that the institution request has been received (no verification needed)
 */
export const sendRequestReceivedNotification = async (
  email: string,
  institutionName: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F172A;">Institution Request Received</h2>
      <p>Dear Administrator,</p>
      <p>We have successfully received your request to register <strong>${institutionName}</strong> on the E-Clearance platform.</p>
      <p>Your request is currently <strong>pending review</strong> by our system administrators. You will receive another email once your request has been processed.</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #0F172A; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Status:</strong> Pending Administrator Approval</p>
      </div>

      <p>Thank you for choosing E-Clearance to streamline your institutional workflows.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `Request Received: ${institutionName} Access Request`,
    html,
    text: `Your request for institutional access for ${institutionName} has been received and is pending approval.`
  });
};

// Send approval notification
export const sendApprovalNotification = async (
  email: string,
  institutionName: string,
  domain: string
): Promise<void> => {
  const loginUrl = 'https://clear-ed-8u77.vercel.app/';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F172A;">🎉 Your Institution Request Has Been Approved!</h2>
      <p>Dear Administrator,</p>
      <p>Great news! Your request for <strong>${institutionName}</strong> has been approved.</p>
      <p>Your institution is now part of the E-Clearance platform. Users with email addresses ending in <strong>@${domain}</strong> can now register and access the system.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" 
           style="background-color: #0F172A; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to E-Clearance
        </a>
      </div>
      <h3>Next Steps:</h3>
      <ol>
        <li>Share the login page with your institution members</li>
        <li>Users will register with their institutional email (@${domain})</li>
        <li>You'll be automatically assigned as an administrator</li>
      </ol>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">
        If you have any questions, please don't hesitate to contact our support team.
      </p>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `✅ Institution Approved - ${institutionName}`,
    html,
    text: `Your institution request for ${institutionName} has been approved. Users can now register at ${loginUrl}`
  });
};

// Send rejection notification
export const sendRejectionNotification = async (
  email: string,
  institutionName: string,
  reason: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Regarding Your Institution Request</h2>
      <p>Dear Administrator,</p>
      <p>After careful review, we are unable to approve your request for <strong>${institutionName}</strong> at this time.</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <h3 style="color: #dc2626; margin-top: 0;">Reason:</h3>
        <p>${reason}</p>
      </div>
      
      <h3>What you can do:</h3>
      <ul>
        <li>Address the mentioned concerns and submit a new request</li>
        <li>Ensure your domain is properly configured and verifiable</li>
        <li>Contact our support team for clarification</li>
      </ul>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">
        Thank you for your interest in E-Clearance.
      </p>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `Regarding Your Institution Request - ${institutionName}`,
    html,
    text: `Your institution request for ${institutionName} was not approved. Reason: ${reason}`
  });
};

// Send suspension notification
export const sendSuspensionNotification = async (
  email: string,
  institutionName: string,
  reason: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Institution Access Suspended</h1>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear Administrator,</p>
        <p>This email is to formally notify you that the access for <strong>${institutionName}</strong> on the E-Clearance platform has been <strong>suspended</strong> by our system administrators.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 25px 0;">
          <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">Reason for Suspension:</h3>
          <p style="color: #7f1d1d; margin-bottom: 0; line-height: 1.5;">${reason}</p>
        </div>
        
        <h3>What this means:</h3>
        <ul style="color: #475569; line-height: 1.6;">
          <li>Users can no longer log in using institutional credentials.</li>
          <li>All ongoing clearance workflows for your institution have been paused.</li>
          <li>Management access to the institution dashboard is currently restricted.</li>
        </ul>
        
        <p style="margin-top: 30px;">If you believe this is an error or would like to request reactivation, please contact our support team at <a href="mailto:cleared.system@gmail.com" style="color: #2563eb;">cleared.system@gmail.com</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          This is an automated security notification. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `🚨 [SECURITY UPDATE] Institution Access Suspended - ${institutionName}`,
    html,
    text: `The access for ${institutionName} has been suspended. Reason: ${reason}. Please contact support for more information.`
  });
};

// Send reactivation notification
export const sendReactivationNotification = async (
  email: string,
  institutionName: string
): Promise<void> => {
  const loginUrl = 'https://clear-ed-8u77.vercel.app/';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Institution Access Restored</h1>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear Administrator,</p>
        <p>We are pleased to inform you that the access for <strong>${institutionName}</strong> on the E-Clearance platform has been <strong>successfully reactivated</strong> by our system administrators.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 25px 0;">
          <p style="color: #065f46; margin-bottom: 0; line-height: 1.5;">Your institutional dashboard and all associated clearance workflows have been fully restored and are now operational.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background-color: #0F172A; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">
            Log In to E-Clearance
          </a>
        </div>
        
        <p>Your team and staff members can now resume their activities on the platform using their standard institutional credentials.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          Thank you for your patience and for being part of the E-Clearance community.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `✅ [System Update] Institution Access Reactivated - ${institutionName}`,
    html,
    text: `The access for ${institutionName} has been fully reactivated. You can now log in at ${loginUrl}`
  });
};

// Send permanent deletion notification
export const sendPermanentDeletionNotification = async (
  email: string,
  institutionName: string
): Promise<void> => {
  const requestAccessUrl = 'https://clear-ed-8u77.vercel.app/request-institution-access';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F172A;">Institution Account Permanently Removed</h2>
      <p>Dear Administrator,</p>
      <p>This email is to confirm that the institutional account for <strong>${institutionName}</strong> has been <strong>permanently deleted</strong> from the E-Clearance platform.</p>
      
      <p>As part of this process, all associated data, including user accounts, clearance records, and organizational configurations, have been purged from our active systems.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="color: #0F172A; margin-top: 0; font-size: 16px;">Thinking of returning?</h3>
        <p style="color: #475569; margin-bottom: 20px;">If your institution wishes to use E-Clearance again in the future, you are welcome to submit a fresh application at any time.</p>
        <div style="text-align: center;">
          <a href="${requestAccessUrl}" 
             style="background-color: #0F172A; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">
            Request New Access
          </a>
        </div>
      </div>
      
      <p>Thank you for the time you spent with us on the platform.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 13px; text-align: center;">
        This is an automated administrative notification.
      </p>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `Institution Account Removed - ${institutionName}`,
    html,
    text: `The institutional account for ${institutionName} has been permanently removed. If you wish to use E-Clearance again, you can request new access at ${requestAccessUrl}`
  });
};

// Send clarification request notification
export const sendClarificationNotification = async (
  email: string,
  institutionName: string,
  clarification: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0F172A;">Clarification Needed for Your Institution Request</h2>
      <p>Dear Administrator,</p>
      <p>We are reviewing your request for <strong>${institutionName}</strong> and need some additional information.</p>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0;">
        <h3 style="color: #0ea5e9; margin-top: 0;">Clarification Requested:</h3>
        <p>${clarification}</p>
      </div>
      
      <p>Please provide the requested information so we can continue processing your application.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">
        If you have any questions, please don't hesitate to contact our support team.
      </p>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `Clarification Needed - ${institutionName}`,
    html,
    text: `We need clarification for your institution request: ${clarification}`
  });
};

// Send contact form email
export const sendContactFormEmail = async (
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    service?: string;
    description: string;
  }
): Promise<void> => {
  const adminEmail = 'cleared.system@gmail.com';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0F172A; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">New Contact Form Submission</h2>
      </div>
      <div style="padding: 30px;">
        <p style="color: #666; margin-top: 0;">You have received a new message from the E-Clearance contact page.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 120px;"><strong>Name:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #0F172A;">${formData.firstName} ${formData.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #0F172A;">
              <a href="mailto:${formData.email}" style="color: #0F172A; text-decoration: none;">${formData.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Service:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #0F172A;">${formData.service || 'Not specified'}</td>
          </tr>
        </table>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid #0F172A;">
          <h4 style="margin-top: 0; color: #0F172A;">Message Description:</h4>
          <p style="color: #334155; line-height: 1.6; margin-bottom: 0;">${formData.description}</p>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
        This email was automatically generated by the E-Clearance System.
      </div>
    </div>
  `;

  await sendEmail({
    from: `"Contact: ${formData.firstName} ${formData.lastName}" <cleared.system@gmail.com>`,
    to: adminEmail,
    replyTo: formData.email,
    subject: `📩 Contact Form: ${formData.firstName} ${formData.lastName} - ${formData.service || 'General Inquiry'}`,
    html,
    text: `New contact form from ${formData.firstName} ${formData.lastName} (${formData.email}). Service: ${formData.service || 'None'}. Message: ${formData.description}`
  });
};

/**
 * Send a professional announcement email to users
 */
export const sendAnnouncementEmail = async (
  email: string,
  announcement: {
    title: string;
    content: string;
    type: string;
    priority: string;
    attachments?: string[];
  }
): Promise<void> => {
  let baseUrl = process.env.FRONTEND_URL || 'https://clear-ed-8u77.vercel.app';
  baseUrl = baseUrl.replace(/\/$/, '');
  const loginUrl = `${baseUrl}/`;
  
  // Priority colors for branding
  const priorityColors: Record<string, string> = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#059669',
    critical: '#dc2626'
  };
  
  const priorityColor = priorityColors[announcement.priority.toLowerCase()] || '#0F172A';
  
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: ${priorityColor}; padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          System Announcement
        </h1>
      </div>
      
      <div style="padding: 40px 30px;">
        <div style="display: inline-block; padding: 4px 12px; border-radius: 999px; background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px;">
          ${announcement.type} &bull; ${announcement.priority} Priority
        </div>
        
        <h2 style="color: #0F172A; margin: 0 0 20px 0; font-size: 24px; line-height: 1.3; font-weight: 800;">
          ${announcement.title}
        </h2>
        
        <div style="color: #334155; line-height: 1.7; font-size: 16px; white-space: pre-wrap; margin-bottom: 30px;">
          ${announcement.content}
        </div>
        
        ${announcement.attachments && announcement.attachments.length > 0 ? `
          <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #0F172A; font-size: 14px;">Attachments:</p>
            <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 13px;">
              ${announcement.attachments.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="text-align: center;">
          <a href="${loginUrl}" 
             style="background-color: #0F172A; color: #ffffff; padding: 14px 35px; 
                    text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 15px;">
            View Announcement in App
          </a>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This is an official system announcement from the E-Clearance Platform.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    from: '"E-Clearance System" <cleared.system@gmail.com>',
    to: email,
    subject: `[${announcement.priority.toUpperCase()}] ${announcement.title}`,
    html,
    text: `${announcement.title}\n\n${announcement.content}\n\nView details at: ${loginUrl}`
  });
};
