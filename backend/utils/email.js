'use strict';
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('Warning: SENDGRID_API_KEY is not set in environment variables.');
}

/**
 * Sends a verification email to a new user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 */
async function sendVerificationEmail(email, name, token) {
  // Ensure we use the production URL if no environment variable is set
  const baseUrl = process.env.VERIFICATION_URL_BASE || 'https://learn-lab-2.onrender.com';
  const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify-email?token=${token}`;
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Confirm your LearnLab account',
    text: `Hello ${name},\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThank you!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
        <h2 style="color: #2563eb;">Welcome to LearnLab, ${name}!</h2>
        <p>Thanks for signing up! Please verify your email address to activate your account and start learning.</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationUrl}" 
             target="_blank"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">
          If the button above doesn't work, please copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; word-break: break-all;">
          <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message from LearnLab. If you did not create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('--- EMAIL MOCK (SENDGRID_API_KEY not set) ---');
      console.log(`To: ${email}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('---------------------------------------------');
      return;
    }
    await sgMail.send(msg);
    console.log(`[EMAIL] Verification email sent to ${email}`);
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('Failed to send verification email');
  }
}

/**
 * Sends a password reset email to a user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Password reset token
 */
async function sendPasswordResetEmail(email, name, token) {
  // Ensure we use the production URL if no environment variable is set
  const baseUrl = process.env.VERIFICATION_URL_BASE || 'https://learn-lab-2.onrender.com';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Reset your LearnLab password',
    text: `Hello ${name},\n\nYou requested to reset your password. Click the following link to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nThank you!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password for your LearnLab account. Click the button below to create a new password.</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" 
             target="_blank"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">
          If the button above doesn't work, please copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; word-break: break-all;">
          <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message from LearnLab.
        </p>
      </div>
    `,
  };

  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('--- EMAIL MOCK (SENDGRID_API_KEY not set) ---');
      console.log(`To: ${email}`);
      console.log(`Password Reset URL: ${resetUrl}`);
      console.log('---------------------------------------------');
      return;
    }
    await sgMail.send(msg);
    console.log(`[EMAIL] Password reset email sent to ${email}`);
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('Failed to send password reset email');
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
