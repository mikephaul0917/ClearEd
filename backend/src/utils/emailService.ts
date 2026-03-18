// Mock email service for development - replace with actual nodemailer implementation
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // For development, just log email instead of sending it
    console.log(`📧 EMAIL SENT TO: ${options.to}`);
    console.log(`📋 SUBJECT: ${options.subject}`);
    console.log(`📄 CONTENT: ${options.html.substring(0, 100)}...`);
    
    // In production, replace this with actual nodemailer implementation:
    /*
    import nodemailer from 'nodemailer';
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@eclearance.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    */
    
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
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-institution/${token}`;
  
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
    to: email,
    subject: `Verify Your Institution Request - ${institutionName}`,
    html,
    text: `Please verify your email address for your institution request: ${verificationUrl}`
  });
};

// Send approval notification
export const sendApprovalNotification = async (
  email: string,
  institutionName: string,
  domain: string
): Promise<void> => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`;
  
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
    to: email,
    subject: `Regarding Your Institution Request - ${institutionName}`,
    html,
    text: `Your institution request for ${institutionName} was not approved. Reason: ${reason}`
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
    to: email,
    subject: `Clarification Needed - ${institutionName}`,
    html,
    text: `We need clarification for your institution request: ${clarification}`
  });
};
