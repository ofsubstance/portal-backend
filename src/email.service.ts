import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // e.g., ""
      port: parseInt(process.env.EMAIL_PORT, 10) || 587, // Default SMTP port
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Sender email address
        pass: process.env.EMAIL_PASSWORD, // Email password or app password
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #FF0A0A; text-align: center;">Welcome to Of Substance!</h2>
          <p>Hello,</p>
          <p>Thank you for signing up on <strong>Of Substance</strong>. To complete your registration and start using our services, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationLink}" style="background-color: #FF0A0A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Verify Email</a>
          </div>
          <p>If the button above doesn’t work, you can also verify your email by copying and pasting the following link into your browser:</p>
          <p style="word-wrap: break-word;">
            <a href="${verificationLink}" style="color: #FF0A0A;">${verificationLink}</a>
          </p>
          <p>If you didn’t sign up for <strong>Your App</strong>, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent from <strong>Your App</strong>. Please do not reply to this email as it is not monitored.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested to reset your password for Of Substance.</p>
        <p>Click the link below to reset it:</p>
        <a href="${resetLink}" style="color: #4CAF50;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
