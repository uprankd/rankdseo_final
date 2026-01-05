import Mailgun from 'mailgun.js';
import FormData from 'form-data';

// Initialize Mailgun client
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_REGION === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
});

export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  metadata?: Record<string, any>;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  metadata,
}: SendEmailParams) {
  try {
    // Validate that either text or html is provided
    if (!text && !html) {
      throw new Error('Either text or html must be provided');
    }

    // Prepare email data
    const emailData: any = {
      from: `${process.env.MAILGUN_FROM_NAME || 'RankdSEO'} <${process.env.MAILGUN_FROM_EMAIL || 'noreply@' + process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
    };

    // Add content
    if (html) {
      emailData.html = html;
      // Also add text version for email clients that don't support HTML
      emailData.text = text || html.replace(/<[^>]*>/g, '');
    } else if (text) {
      emailData.text = text;
    }

    // Add metadata for tracking
    if (metadata) {
      emailData['v:metadata'] = JSON.stringify({
        ...metadata,
        sentAt: new Date().toISOString(),
      });
    }

    // Send email through Mailgun
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, emailData);

    console.log(`📧 Email sent to ${to}: ${subject} - Message ID: ${response.id}`);

    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error('📧 Email sending error:', error);
    throw error;
  }
}

// Email template builders
export const emailTemplates = {
  welcome: (userName: string, userEmail: string) => ({
    subject: '🎉 Welcome to RankdSEO!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚀 Welcome to RankdSEO!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}! 👋</h2>
              <p>Thank you for joining <strong>RankdSEO</strong> - your ultimate backlink opportunity discovery platform!</p>
              
              <p>We're excited to help you discover high-quality backlink opportunities with step-by-step tutorials.</p>
              
              <h3>What's Next?</h3>
              <ul>
                <li>✅ Explore 64+ backlink opportunities</li>
                <li>✅ Follow detailed step-by-step tutorials</li>
                <li>✅ Track your progress with projects</li>
                <li>✅ Build powerful backlinks to boost your SEO</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities" class="button">Explore Opportunities →</a>
              </div>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Happy link building! 🔗</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p>You're receiving this email because you signed up at RankdSEO.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  subscriptionActivated: (userName: string, planName: string, features: string[]) => ({
    subject: '✅ Your RankdSEO Subscription is Active!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .plan-box { background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 Subscription Activated!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}! 👋</h2>
              <p>Your <strong>${planName}</strong> subscription is now active and ready to use!</p>
              
              <div class="plan-box">
                <h3 style="margin-top: 0;">Your Plan Features:</h3>
                <ul>
                  ${features.map(f => `<li>✅ ${f}</li>`).join('')}
                </ul>
              </div>
              
              <p>You now have full access to all premium features. Start discovering and building high-quality backlinks today!</p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard →</a>
              </div>
              
              <p>Thank you for choosing RankdSEO! 🚀</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  subscriptionCancelled: (userName: string, endDate: string) => ({
    subject: '😢 Your RankdSEO Subscription Has Been Cancelled',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Subscription Cancelled</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>We're sorry to see you go! Your RankdSEO subscription has been cancelled.</p>
              
              <div class="info-box">
                <strong>⏰ Access Until:</strong> ${endDate}<br>
                You'll continue to have access to your subscription benefits until this date.
              </div>
              
              <p>After this date, your account will revert to the free plan with limited access.</p>
              
              <h3>We'd love to have you back!</h3>
              <p>If you change your mind, you can reactivate your subscription anytime from your dashboard.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" class="button">Reactivate Subscription →</a>
              </div>
              
              <p>Thank you for being part of RankdSEO. We hope to see you again soon!</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  paymentReceipt: (userName: string, amount: number, planName: string, transactionId: string) => ({
    subject: '💳 Payment Receipt - RankdSEO',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .receipt-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 20px; font-weight: bold; color: #059669; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">💳 Payment Receipt</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}! 👋</h2>
              <p>Thank you for your payment! Here's your receipt:</p>
              
              <div class="receipt-box">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <div class="receipt-row">
                  <span>Plan:</span>
                  <strong>${planName}</strong>
                </div>
                <div class="receipt-row">
                  <span>Amount:</span>
                  <strong>$${(amount / 100).toFixed(2)}</strong>
                </div>
                <div class="receipt-row">
                  <span>Transaction ID:</span>
                  <span>${transactionId}</span>
                </div>
                <div class="receipt-row">
                  <span>Date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                <div class="receipt-row" style="border-bottom: none;">
                  <span class="total">Total Paid:</span>
                  <span class="total">$${(amount / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <p>Your subscription is now active and you have full access to all premium features.</p>
              
              <p>Questions about your payment? Contact our support team anytime.</p>
              
              <p>Thank you for choosing RankdSEO! 🚀</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p>This is an automated receipt for your records.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (userName: string, newPassword: string, resetByAdmin: string) => ({
    subject: '🔐 Your RankdSEO Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: #fefce8; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .password { font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 2px; font-family: monospace; }
            .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Your RankdSEO password has been reset by admin <strong>${resetByAdmin}</strong>.</p>
              
              <div class="password-box">
                <p style="margin: 0 0 10px 0;">Your New Password:</p>
                <div class="password">${newPassword}</div>
              </div>
              
              <div class="warning-box">
                <strong>⚠️ Important Security Notice:</strong><br>
                • Please change this password immediately after logging in<br>
                • Never share your password with anyone<br>
                • Use a strong, unique password
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/signin" class="button">Login Now →</a>
              </div>
              
              <p>If you didn't request this password reset, please contact our support team immediately.</p>
              
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p>This email contains sensitive information. Please delete after use.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};
