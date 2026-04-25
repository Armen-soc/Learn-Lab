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
  const verificationUrl = `${process.env.VERIFICATION_URL_BASE || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Please verify your email address',
    text: `Hello ${name},\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThank you!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2>Welcome to LearnLab, ${name}!</h2>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">If you did not create an account, please ignore this email.</p>
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

module.exports = {
  sendVerificationEmail
};
