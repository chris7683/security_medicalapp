import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// Create transporter
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth.user && emailConfig.auth.pass ? emailConfig.auth : undefined,
});

// Verify transporter configuration
if (emailConfig.auth.user && emailConfig.auth.pass) {
  transporter.verify().then(() => {
    // eslint-disable-next-line no-console
    console.log('Email service is ready to send messages');
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Email service configuration error:', error);
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // If email is not configured, log the email instead
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      // eslint-disable-next-line no-console
      console.log('Email not configured. Would send email:', {
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

    await transporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log(`Password reset email sent to ${options.to}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending email:', error);
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

