import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // 465 requires secure=true
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.MAIL_FROM,
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
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #FF0A0A; text-align: center;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your <strong>Of Substance</strong> account. To proceed with resetting your password, please click the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #FF0A0A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Reset Password</a>
          </div>
          <p>If the button above doesn't work, you can also reset your password by copying and pasting the following link into your browser:</p>
          <p style="word-wrap: break-word;">
            <a href="${resetLink}" style="color: #FF0A0A;">${resetLink}</a>
          </p>
          <p>If you didn't request this password reset, you can safely ignore this email. Your account security has not been compromised.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This email was sent from <strong>Of Substance</strong>. Please do not reply to this email as it is not monitored.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
