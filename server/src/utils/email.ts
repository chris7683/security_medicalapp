import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration from environment variables
// Supports free sandbox services: Ethereal Email, Mailtrap, or custom SMTP
const getEmailConfig = async () => {
  // Option 1: Use Ethereal Email (free, auto-generates test account)
  if (process.env.USE_ETHEREAL_EMAIL === 'true' || (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'production')) {
    try {
      // Create a test account automatically (free, no signup required)
      const testAccount = await nodemailer.createTestAccount();
      return {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        isEthereal: true,
      };
    } catch (error) {
      console.warn('Failed to create Ethereal test account, falling back to console logging:', error);
      return null;
    }
  }

  // Option 2: Use Mailtrap (free sandbox, requires signup at mailtrap.io)
  if (process.env.USE_MAILTRAP === 'true' || process.env.SMTP_HOST === 'smtp.mailtrap.io') {
    return {
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      secure: false, // Mailtrap uses STARTTLS
      auth: {
        user: process.env.SMTP_USER || process.env.MAILTRAP_USER,
        pass: process.env.SMTP_PASSWORD || process.env.MAILTRAP_PASS,
      },
      isEthereal: false,
    };
  }

  // Option 3: Custom SMTP configuration
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      isEthereal: false,
    };
  }

  // No email configuration
  return null;
};

// Create transporter (will be initialized asynchronously)
let transporter: nodemailer.Transporter | null = null;
let emailConfig: any = null;

// Initialize email transporter
(async () => {
  emailConfig = await getEmailConfig();
  
  if (emailConfig) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ Email service is ready to send messages');
      if (emailConfig.isEthereal) {
        console.log('📧 Using Ethereal Email (free sandbox)');
        console.log('   View emails at: https://ethereal.email');
        console.log(`   Test account: ${emailConfig.auth.user}`);
      } else if (emailConfig.host === 'smtp.mailtrap.io') {
        console.log('📧 Using Mailtrap (free sandbox)');
        console.log('   View emails at: https://mailtrap.io');
      } else {
        console.log(`📧 Using SMTP: ${emailConfig.host}:${emailConfig.port}`);
      }
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      transporter = null;
    }
  } else {
    console.log('⚠️  Email not configured. Emails will be logged to console only.');
  }
})();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Wait for transporter to be initialized if not ready yet
    if (!transporter) {
      // Try to initialize if not done yet
      if (!emailConfig) {
        emailConfig = await getEmailConfig();
        if (emailConfig) {
          transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: emailConfig.auth,
          });
        }
      }
    }

    // If email is not configured, log the email instead
    if (!transporter || !emailConfig) {
      console.log('📧 Email not configured. Would send email:', {
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return;
    }

    const mailOptions = {
      from: `"Healthcare App" <${emailConfig.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    
    // If using Ethereal Email, log the preview URL
    if (emailConfig.isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`✅ Password reset email sent to ${options.to}`);
        console.log(`   📧 Preview URL: ${previewUrl}`);
      } else {
        console.log(`✅ Password reset email sent to ${options.to}`);
      }
    } else {
      console.log(`✅ Password reset email sent to ${options.to}`);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetOTP(email: string, otp: string, username: string): Promise<void> {
  const subject = 'Password Reset Request';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Hello ${username},</p>
        <p>You have requested to reset your password. Please use the following One-Time Password (OTP) to reset your password:</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3498db; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in <strong>15 minutes</strong>.</p>
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

export async function sendLoginOTP(email: string, otp: string, username: string): Promise<void> {
  const subject = 'Login Verification Code';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50;">Login Verification</h2>
        <p>Hello ${username},</p>
        <p>You have successfully entered your password. Please use the following One-Time Password (OTP) to complete your login:</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3498db; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not attempt to log in, please ignore this email and consider changing your password.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

