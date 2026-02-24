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
  welcome: (userName: string, userEmail: string, planName?: string) => ({
    subject: '🎉 Welcome to RankdSEO - Your Account is Ready!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .welcome-card { background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; margin: 4px 4px 4px 0; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-cyan { background: #cffafe; color: #0e7490; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .feature-list { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .feature-item { display: flex; align-items: center; margin: 10px 0; }
            .check { color: #10b981; font-weight: bold; margin-right: 10px; }
            .stats-box { background: linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .stat-number { font-size: 36px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 14px; color: #6b7280; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🚀 Welcome to RankdSEO!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your backlink building journey starts now</p>
            </div>
            <div class="content">
              <h2 style="color: #1e40af;">Hi ${userName}! 👋</h2>
              <p>Thank you for joining <strong>RankdSEO</strong> - your ultimate backlink opportunity discovery platform!</p>
              
              ${planName ? `
              <div class="welcome-card">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                  <span style="font-size: 24px;">🎫</span>
                  <div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Your Plan</div>
                    <div style="font-size: 20px; font-weight: bold; color: #1e40af;">${planName}</div>
                  </div>
                </div>
                <span class="badge badge-green">✓ Account Active</span>
                <span class="badge badge-blue">Full Access</span>
              </div>
              ` : ''}
              
              <div class="stats-box">
                <div class="stat-number">1,300+</div>
                <div class="stat-label">Backlink Opportunities Available</div>
              </div>
              
              <div class="feature-list">
                <h3 style="margin-top: 0; color: #1e40af;">🎯 What You Can Do:</h3>
                <div class="feature-item"><span class="check">✅</span> Explore 1,300+ high-quality backlink opportunities</div>
                <div class="feature-item"><span class="check">✅</span> Follow detailed step-by-step tutorials with screenshots</div>
                <div class="feature-item"><span class="check">✅</span> Track your progress with custom projects</div>
                <div class="feature-item"><span class="check">✅</span> Filter by Domain Authority, niche, and link type</div>
                <div class="feature-item"><span class="check">✅</span> Build powerful backlinks to boost your SEO</div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities" class="button" style="color: white;">
                  🔗 Start Exploring Opportunities →
                </a>
              </div>
              
              <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong>💡 Pro Tip:</strong> Start with high Domain Authority (DA 50+) opportunities for maximum SEO impact!
              </div>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Happy link building! 🔗</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p style="font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Manage email preferences</a>
              </p>
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
            .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-card { background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
            .password-label { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
            .password { font-size: 28px; font-weight: bold; color: #1e40af; letter-spacing: 3px; font-family: monospace; background: #eff6ff; padding: 15px 20px; border-radius: 8px; display: inline-block; }
            .warning-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .warning-title { color: #92400e; font-weight: bold; font-size: 16px; margin-bottom: 10px; }
            .warning-item { color: #78350f; margin: 8px 0; display: flex; align-items: center; }
            .warning-icon { margin-right: 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .info-box { background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .admin-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your password has been changed</p>
            </div>
            <div class="content">
              <h2 style="color: #1e40af;">Hi ${userName}! 👋</h2>
              
              <div class="info-box">
                <p style="margin: 0;">Your RankdSEO password has been reset by admin <span class="admin-badge">${resetByAdmin}</span></p>
              </div>
              
              <div class="password-card">
                <div class="password-label">Your New Password</div>
                <div class="password">${newPassword}</div>
                <p style="margin: 15px 0 0 0; font-size: 13px; color: #6b7280;">Copy this password and use it to log in</p>
              </div>
              
              <div class="warning-box">
                <div class="warning-title">⚠️ Important Security Notice</div>
                <div class="warning-item"><span class="warning-icon">🔄</span> Please change this password immediately after logging in</div>
                <div class="warning-item"><span class="warning-icon">🔒</span> Never share your password with anyone</div>
                <div class="warning-item"><span class="warning-icon">💪</span> Use a strong, unique password with 8+ characters</div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/signin" class="button" style="color: white;">🚀 Login Now →</a>
              </div>
              
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong style="color: #dc2626;">🚨 Didn't request this?</strong>
                <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 14px;">If you didn't request this password reset, please contact our support team immediately.</p>
              </div>
              
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p style="font-size: 12px; color: #9ca3af;">This email contains sensitive information. Please delete after use.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  newOpportunity: (userName: string, opportunity: {
    siteName: string;
    shortDescription: string;
    category: string;
    linkType: string;
    domainAuthority?: number;
    isFree: boolean;
    id: string;
  }) => ({
    subject: `🔗 New Backlink Opportunity: ${opportunity.siteName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .opportunity-card { background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 4px 4px 4px 0; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-purple { background: #f3e8ff; color: #7c3aed; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .stats { display: flex; gap: 20px; margin: 15px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 12px; color: #6b7280; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔗 New Opportunity Added!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A new backlink opportunity is available</p>
            </div>
            <div class="content">
              <h2>Hi ${userName}! 👋</h2>
              <p>Great news! A new backlink opportunity has just been added to RankdSEO:</p>
              
              <div class="opportunity-card">
                <h3 style="margin-top: 0; color: #1e40af; font-size: 22px;">${opportunity.siteName}</h3>
                <p style="color: #4b5563; margin: 10px 0;">${opportunity.shortDescription}</p>
                
                <div style="margin: 15px 0;">
                  <span class="badge badge-blue">${opportunity.category}</span>
                  <span class="badge badge-purple">${opportunity.linkType.replace('_', ' ')}</span>
                  ${opportunity.isFree ? '<span class="badge badge-green">FREE</span>' : ''}
                </div>
                
                ${opportunity.domainAuthority ? `
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                  <div style="display: inline-block; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #0369a1;">DA ${opportunity.domainAuthority}</div>
                    <div style="font-size: 12px; color: #6b7280;">Domain Authority</div>
                  </div>
                </div>
                ` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities/${opportunity.id}" class="button" style="color: white;">
                  View Opportunity & Tutorial →
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This opportunity includes a step-by-step tutorial to help you acquire this backlink successfully.
              </p>
              
              <p>Happy link building! 🚀</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p style="font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Manage email preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  projectMilestone: (userName: string, milestone: {
    projectName: string;
    milestoneName: string;
    completedCount: number;
    totalCount: number;
    percentComplete: number;
    recentLinks: Array<{ siteName: string; status: string }>;
    projectId: string;
  }) => ({
    subject: `🎯 Milestone Reached: ${milestone.milestoneName} - ${milestone.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .milestone-card { background: white; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
            .milestone-icon { font-size: 48px; margin-bottom: 10px; }
            .milestone-name { font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0; }
            .project-name { font-size: 14px; color: #6b7280; }
            .progress-container { background: #e5e7eb; border-radius: 10px; height: 20px; margin: 20px 0; overflow: hidden; }
            .progress-bar { background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%); height: 100%; border-radius: 10px; transition: width 0.3s; }
            .stats-row { display: flex; justify-content: center; gap: 40px; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .links-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .links-table th { background: #f0f9ff; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }
            .links-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
            .status-verified { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-rejected { background: #fee2e2; color: #dc2626; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .celebration { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎯 Milestone Reached!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">You're making amazing progress</p>
            </div>
            <div class="content">
              <h2 style="color: #1e40af;">Congratulations, ${userName}! 🎉</h2>
              
              <div class="milestone-card">
                <div class="milestone-icon">🏆</div>
                <div class="milestone-name">${milestone.milestoneName}</div>
                <div class="project-name">Project: ${milestone.projectName}</div>
              </div>
              
              <div class="celebration">
                <p style="margin: 0; font-size: 18px;">🌟 You've completed <strong>${milestone.completedCount}</strong> out of <strong>${milestone.totalCount}</strong> backlinks! 🌟</p>
              </div>
              
              <div style="margin: 25px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: bold; color: #374151;">Progress</span>
                  <span style="font-weight: bold; color: #10b981;">${milestone.percentComplete}%</span>
                </div>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${milestone.percentComplete}%;"></div>
                </div>
              </div>
              
              <div class="stats-row">
                <div class="stat">
                  <div class="stat-value">${milestone.completedCount}</div>
                  <div class="stat-label">Completed</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${milestone.totalCount - milestone.completedCount}</div>
                  <div class="stat-label">Remaining</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${milestone.percentComplete}%</div>
                  <div class="stat-label">Complete</div>
                </div>
              </div>
              
              <h3 style="color: #1e40af; margin-top: 30px;">📋 Recent Link Activity</h3>
              <table class="links-table">
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${milestone.recentLinks.map(link => `
                    <tr>
                      <td style="font-weight: 500;">${link.siteName}</td>
                      <td>
                        <span class="status-badge ${link.status === 'Verified' ? 'status-verified' : link.status === 'Pending' ? 'status-pending' : 'status-rejected'}">
                          ${link.status === 'Verified' ? '✓ ' : link.status === 'Pending' ? '⏳ ' : '✗ '}${link.status}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${milestone.projectId}" class="button" style="color: white;">
                  📊 View Full Project →
                </a>
              </div>
              
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong style="color: #166534;">💡 Keep Going!</strong>
                <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">You're doing great! Keep building backlinks to improve your SEO rankings.</p>
              </div>
              
              <p>Happy link building! 🔗</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p style="font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Manage email preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  weeklyReport: (userName: string, report: {
    weekStart: string;
    weekEnd: string;
    linksAdded: number;
    linksVerified: number;
    linksPending: number;
    projectsActive: number;
    topOpportunities: Array<{ name: string; da: number }>;
    weeklyChange: { links: number; verified: number };
    totalBacklinks: number;
  }) => ({
    subject: `📊 Your Weekly SEO Report - ${report.weekStart} to ${report.weekEnd}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .date-range { background: rgba(255,255,255,0.2); display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-top: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: white; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; }
            .stat-value { font-size: 36px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 13px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }
            .stat-change { font-size: 12px; margin-top: 5px; }
            .change-up { color: #10b981; }
            .change-down { color: #ef4444; }
            .change-neutral { color: #6b7280; }
            .highlight-card { background: linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .opportunities-list { background: white; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .opp-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .opp-item:last-child { border-bottom: none; }
            .opp-name { font-weight: 500; color: #1e40af; }
            .opp-da { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .tip-box { background: #fef3c7; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">📊 Weekly Report</h1>
              <div class="date-range">${report.weekStart} - ${report.weekEnd}</div>
            </div>
            <div class="content">
              <h2 style="color: #1e40af;">Hi ${userName}! 👋</h2>
              <p>Here's your backlink building progress for this week:</p>
              
              <div class="highlight-card">
                <div style="font-size: 14px; color: #6b7280; text-transform: uppercase;">Total Backlinks</div>
                <div style="font-size: 48px; font-weight: bold; color: #3b82f6;">${report.totalBacklinks}</div>
                <div style="font-size: 14px; color: #6b7280;">across all projects</div>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${report.linksAdded}</div>
                  <div class="stat-label">Links Added</div>
                  <div class="stat-change ${report.weeklyChange.links > 0 ? 'change-up' : report.weeklyChange.links < 0 ? 'change-down' : 'change-neutral'}">
                    ${report.weeklyChange.links > 0 ? '↑' : report.weeklyChange.links < 0 ? '↓' : '→'} ${Math.abs(report.weeklyChange.links)} vs last week
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${report.linksVerified}</div>
                  <div class="stat-label">Verified</div>
                  <div class="stat-change ${report.weeklyChange.verified > 0 ? 'change-up' : report.weeklyChange.verified < 0 ? 'change-down' : 'change-neutral'}">
                    ${report.weeklyChange.verified > 0 ? '↑' : report.weeklyChange.verified < 0 ? '↓' : '→'} ${Math.abs(report.weeklyChange.verified)} vs last week
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${report.linksPending}</div>
                  <div class="stat-label">Pending</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${report.projectsActive}</div>
                  <div class="stat-label">Active Projects</div>
                </div>
              </div>
              
              <div class="opportunities-list">
                <h3 style="margin-top: 0; color: #1e40af;">🔥 Top Opportunities This Week</h3>
                ${report.topOpportunities.map(opp => `
                  <div class="opp-item">
                    <span class="opp-name">${opp.name}</span>
                    <span class="opp-da">DA ${opp.da}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="tip-box">
                <strong>💡 Weekly Tip:</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Focus on high DA (50+) opportunities this week to maximize your SEO impact!</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/analytics" class="button" style="color: white;">
                  📈 View Full Analytics →
                </a>
              </div>
              
              <p>Keep up the great work! 🚀</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p style="font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Manage email preferences</a> · 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Unsubscribe from reports</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  monthlyReport: (userName: string, report: {
    month: string;
    year: number;
    totalLinksAdded: number;
    totalLinksVerified: number;
    totalLinksPending: number;
    totalLinksRejected: number;
    projectsCompleted: number;
    projectsActive: number;
    topCategories: Array<{ name: string; count: number }>;
    monthlyGrowth: number;
    totalBacklinks: number;
    avgDAScore: number;
    bestPerformingProject?: { name: string; links: number };
  }) => ({
    subject: `📅 Your Monthly SEO Report - ${report.month} ${report.year}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .month-badge { background: rgba(255,255,255,0.2); display: inline-block; padding: 8px 20px; border-radius: 20px; font-size: 16px; margin-top: 10px; font-weight: bold; }
            .summary-card { background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%); border: 2px solid #8b5cf6; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 32px; font-weight: bold; color: #6d28d9; }
            .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .growth-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .growth-positive { background: #dcfce7; color: #166534; }
            .growth-negative { background: #fee2e2; color: #dc2626; }
            .growth-neutral { background: #f3f4f6; color: #6b7280; }
            .stats-row { display: flex; justify-content: space-around; margin: 20px 0; padding: 20px; background: white; border-radius: 12px; }
            .stat-item { text-align: center; }
            .stat-number { font-size: 28px; font-weight: bold; }
            .stat-verified { color: #10b981; }
            .stat-pending { color: #f59e0b; }
            .stat-rejected { color: #ef4444; }
            .categories-card { background: white; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .category-bar { display: flex; align-items: center; margin: 10px 0; }
            .category-name { width: 120px; font-weight: 500; color: #374151; }
            .category-progress { flex: 1; height: 24px; background: #e5e7eb; border-radius: 12px; overflow: hidden; margin: 0 10px; }
            .category-fill { height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; }
            .category-count { width: 40px; text-align: right; font-weight: bold; color: #6d28d9; }
            .best-project { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .trophy { font-size: 40px; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">📅 Monthly Report</h1>
              <div class="month-badge">${report.month} ${report.year}</div>
            </div>
            <div class="content">
              <h2 style="color: #6d28d9;">Hi ${userName}! 👋</h2>
              <p>Here's your complete backlink building summary for ${report.month}:</p>
              
              <div class="summary-card">
                <div style="text-align: center;">
                  <div style="font-size: 14px; color: #6b7280; text-transform: uppercase;">Total Backlinks Built</div>
                  <div style="font-size: 56px; font-weight: bold; color: #6d28d9;">${report.totalBacklinks}</div>
                  <div class="growth-badge ${report.monthlyGrowth > 0 ? 'growth-positive' : report.monthlyGrowth < 0 ? 'growth-negative' : 'growth-neutral'}">
                    ${report.monthlyGrowth > 0 ? '↑' : report.monthlyGrowth < 0 ? '↓' : '→'} ${Math.abs(report.monthlyGrowth)}% vs last month
                  </div>
                </div>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-value">${report.totalLinksAdded}</div>
                    <div class="summary-label">Links Added</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${report.avgDAScore}</div>
                    <div class="summary-label">Avg. DA Score</div>
                  </div>
                </div>
              </div>
              
              <h3 style="color: #6d28d9;">📊 Link Status Breakdown</h3>
              <div class="stats-row">
                <div class="stat-item">
                  <div class="stat-number stat-verified">${report.totalLinksVerified}</div>
                  <div style="font-size: 12px; color: #6b7280;">✓ Verified</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number stat-pending">${report.totalLinksPending}</div>
                  <div style="font-size: 12px; color: #6b7280;">⏳ Pending</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number stat-rejected">${report.totalLinksRejected}</div>
                  <div style="font-size: 12px; color: #6b7280;">✗ Rejected</div>
                </div>
              </div>
              
              <div class="categories-card">
                <h3 style="margin-top: 0; color: #6d28d9;">🏷️ Top Categories</h3>
                ${report.topCategories.map((cat, index) => {
                  const maxCount = Math.max(...report.topCategories.map(c => c.count));
                  const percentage = (cat.count / maxCount) * 100;
                  return `
                    <div class="category-bar">
                      <span class="category-name">${cat.name}</span>
                      <div class="category-progress">
                        <div class="category-fill" style="width: ${percentage}%;"></div>
                      </div>
                      <span class="category-count">${cat.count}</span>
                    </div>
                  `;
                }).join('')}
              </div>
              
              ${report.bestPerformingProject ? `
              <div class="best-project">
                <div class="trophy">🏆</div>
                <div style="font-size: 14px; color: #92400e; text-transform: uppercase;">Best Performing Project</div>
                <div style="font-size: 22px; font-weight: bold; color: #78350f; margin: 5px 0;">${report.bestPerformingProject.name}</div>
                <div style="font-size: 14px; color: #92400e;">${report.bestPerformingProject.links} links added this month</div>
              </div>
              ` : ''}
              
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; display: flex; justify-content: space-around; text-align: center;">
                <div>
                  <div style="font-size: 28px; font-weight: bold; color: #10b981;">${report.projectsCompleted}</div>
                  <div style="font-size: 12px; color: #6b7280;">Projects Completed</div>
                </div>
                <div>
                  <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${report.projectsActive}</div>
                  <div style="font-size: 12px; color: #6b7280;">Active Projects</div>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/analytics" class="button" style="color: white;">
                  📈 View Detailed Analytics →
                </a>
              </div>
              
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong style="color: #166534;">🎯 Goal for Next Month:</strong>
                <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">Try to beat your record! Aim for ${Math.round(report.totalLinksAdded * 1.2)} links next month.</p>
              </div>
              
              <p>Amazing progress this month! Keep it up! 🚀</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p style="font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Manage email preferences</a> · 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Unsubscribe from reports</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  paymentReceipt: (userName: string, receipt: {
    invoiceNumber: string;
    transactionId: string;
    date: string;
    planName: string;
    planDescription: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    cardLast4?: string;
    billingEmail: string;
    billingName: string;
    nextBillingDate?: string;
    isLifetime?: boolean;
  }) => ({
    subject: `🧾 Payment Receipt - Invoice #${receipt.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .receipt-card { background: white; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 20px 0; }
            .receipt-header { background: linear-gradient(135deg, #f0f9ff 0%, #ecfeff 100%); padding: 20px; border-bottom: 2px solid #e5e7eb; }
            .receipt-body { padding: 20px; }
            .invoice-number { font-size: 14px; color: #6b7280; }
            .invoice-value { font-size: 18px; font-weight: bold; color: #1e40af; }
            .amount-box { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 25px; text-align: center; margin: 20px 0; border-radius: 12px; }
            .amount-label { font-size: 14px; opacity: 0.9; text-transform: uppercase; }
            .amount-value { font-size: 42px; font-weight: bold; margin: 5px 0; }
            .amount-currency { font-size: 16px; opacity: 0.9; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #6b7280; font-size: 14px; }
            .detail-value { font-weight: 500; color: #1f2937; text-align: right; }
            .plan-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }
            .status-paid { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }
            .payment-method { display: flex; align-items: center; gap: 10px; }
            .card-icon { width: 40px; height: 25px; background: #1e40af; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; }
            .billing-section { background: #f8fafc; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .billing-title { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
            .success-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
            .button-outline { display: inline-block; background: white; color: #3b82f6; padding: 12px 28px; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; border: 2px solid #3b82f6; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
            .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🧾 Payment Receipt</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Thank you for your purchase!</p>
            </div>
            <div class="content">
              <div class="success-banner">
                <span style="font-size: 24px;">✅</span>
                <div style="font-size: 18px; font-weight: bold; color: #166534; margin-top: 5px;">Payment Successful</div>
                <div style="font-size: 14px; color: #15803d;">Your transaction has been completed</div>
              </div>

              <h2 style="color: #1e40af; margin-bottom: 5px;">Hi ${userName}! 👋</h2>
              <p>Thank you for your payment. Here's your receipt for your records.</p>
              
              <div class="amount-box">
                <div class="amount-label">Amount Paid</div>
                <div class="amount-value">${receipt.currency === 'usd' ? '$' : receipt.currency.toUpperCase()} ${receipt.amount.toFixed(2)}</div>
                <div class="amount-currency">${receipt.currency.toUpperCase()}</div>
              </div>

              <div class="receipt-card">
                <div class="receipt-header">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div class="invoice-number">Invoice Number</div>
                      <div class="invoice-value">#${receipt.invoiceNumber}</div>
                    </div>
                    <span class="status-paid">✓ PAID</span>
                  </div>
                </div>
                <div class="receipt-body">
                  <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${receipt.date}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value" style="font-family: monospace; font-size: 12px;">${receipt.transactionId}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Plan</span>
                    <span class="detail-value"><span class="plan-badge">${receipt.planName}</span></span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">${receipt.planDescription}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Payment Method</span>
                    <span class="detail-value">
                      <div class="payment-method">
                        <div class="card-icon">${receipt.paymentMethod === 'stripe' ? 'CARD' : 'PP'}</div>
                        ${receipt.cardLast4 ? `•••• ${receipt.cardLast4}` : receipt.paymentMethod === 'paypal' ? 'PayPal' : 'Card'}
                      </div>
                    </span>
                  </div>
                </div>
              </div>

              <div class="billing-section">
                <div class="billing-title">Billing Information</div>
                <div><strong>${receipt.billingName}</strong></div>
                <div style="color: #6b7280;">${receipt.billingEmail}</div>
              </div>

              ${receipt.isLifetime ? `
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <span style="font-size: 24px;">🎉</span>
                <div style="font-size: 16px; font-weight: bold; color: #92400e; margin-top: 5px;">Lifetime Access Activated!</div>
                <div style="font-size: 14px; color: #78350f;">You have lifetime access - no recurring charges!</div>
              </div>
              ` : receipt.nextBillingDate ? `
              <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Next Billing Date</div>
                    <div style="font-size: 16px; font-weight: bold; color: #1e40af;">${receipt.nextBillingDate}</div>
                  </div>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #3b82f6; font-size: 14px;">Manage Subscription →</a>
                </div>
              </div>
              ` : ''}

              <div class="divider"></div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities" class="button" style="color: white;">
                  🔗 Start Exploring →
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" class="button-outline">
                  📋 View Invoice
                </a>
              </div>

              <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #6b7280;">
                <strong>Need help?</strong> If you have any questions about your purchase or need assistance, please contact our support team. Keep this receipt for your records.
              </div>

              <p>Thank you for choosing RankdSEO! 🚀</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p style="margin-bottom: 5px;"><strong>RankdSEO</strong></p>
              <p style="font-size: 12px; color: #9ca3af;">
                This is an automated receipt for your records.<br>
                Invoice #${receipt.invoiceNumber} · Transaction: ${receipt.transactionId}
              </p>
              <p style="font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b7280;">Account Settings</a> · 
                <a href="mailto:support@rankdseo.com" style="color: #6b7280;">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  accountDeleted: (userName: string, userEmail: string, deletionDate: string) => ({
    subject: '👋 Your RankdSEO Account Has Been Deleted',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .goodbye-card { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
            .info-box { background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .warning-box { background: #fef3c7; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .deleted-items { background: #fee2e2; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .deleted-item { display: flex; align-items: center; margin: 8px 0; color: #991b1b; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">👋 Goodbye, ${userName}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">We're sad to see you go</p>
            </div>
            <div class="content">
              <div class="goodbye-card">
                <div style="font-size: 48px; margin-bottom: 10px;">😢</div>
                <h2 style="margin: 0; color: #374151;">Account Deletion Confirmed</h2>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Your RankdSEO account has been permanently deleted</p>
              </div>

              <div class="info-box">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6b7280;">Account Email:</span>
                  <span style="font-weight: bold;">${userEmail}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Deletion Date:</span>
                  <span style="font-weight: bold;">${deletionDate}</span>
                </div>
              </div>

              <div class="deleted-items">
                <h3 style="margin-top: 0; color: #991b1b;">🗑️ The following data has been deleted:</h3>
                <div class="deleted-item">✗ Your profile and account information</div>
                <div class="deleted-item">✗ All your projects and tracked opportunities</div>
                <div class="deleted-item">✗ Your subscription and payment history</div>
                <div class="deleted-item">✗ Email preferences and settings</div>
              </div>

              <div class="warning-box">
                <strong>⚠️ Important:</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">This action cannot be undone. If you deleted your account by mistake, you'll need to create a new account and start fresh.</p>
              </div>

              <p>We're sorry to see you leave. If you have any feedback about why you decided to delete your account, we'd love to hear it.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:support@rankdseo.com?subject=Account%20Deletion%20Feedback" class="button" style="color: white;">
                  📝 Share Feedback
                </a>
              </div>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <strong style="color: #166534;">🚀 Changed your mind?</strong>
                <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">You're always welcome back! Visit our website to create a new account anytime.</p>
              </div>

              <p>Thank you for being part of the RankdSEO community.</p>
              <p><strong>The RankdSEO Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 RankdSEO. All rights reserved.</p>
              <p style="font-size: 12px; color: #9ca3af;">
                This is a confirmation email for your account deletion request.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};
