import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/mailgun';

export const settingsRouter = router({
  // Profile Management - SECURE VERSION
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        currentPassword: z.string().optional(), // Required if changing email
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, currentPassword } = input;
      const userId = ctx.session.user.id;

      // Get current user
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // If changing email, require password verification
      if (email && email !== user.email) {
        if (!currentPassword) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Password required to change email address',
          });
        }

        // Verify current password
        if (!user.password) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Account has no password set',
          });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Check if new email is already taken
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email is already in use',
          });
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Delete any existing email change tokens for this user
        await ctx.prisma.emailChangeToken.deleteMany({
          where: { userId },
        });

        // Create email change token
        await ctx.prisma.emailChangeToken.create({
          data: {
            token,
            newEmail: email,
            expires,
            userId,
          },
        });

        // Send verification email to OLD email address
        const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const verificationUrl = `${origin}/verify-email-change?token=${token}`;

        await sendEmail({
          to: user.email, // Send to OLD email
          subject: '⚠️ Verify Your Email Change Request - RankdSEO',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                .warning { color: #dc2626; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🔐 Email Change Request</h1>
                </div>
                <div class="content">
                  <p>Hello ${user.name || 'User'},</p>
                  
                  <div class="alert">
                    <p class="warning">⚠️ IMPORTANT SECURITY NOTICE</p>
                    <p>Someone (hopefully you) has requested to change the email address associated with your RankdSEO account.</p>
                  </div>

                  <p><strong>Current Email:</strong> ${user.email}</p>
                  <p><strong>New Email:</strong> ${email}</p>

                  <p>If you made this request, please click the button below to confirm the change:</p>

                  <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verify Email Change</a>
                  </div>

                  <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>

                  <div class="alert">
                    <p class="warning">⛔ Did NOT request this change?</p>
                    <p>If you did not request this email change, <strong>do not click the link</strong> and contact our support immediately. Your account may be compromised.</p>
                    <p>This verification link will expire in 24 hours.</p>
                  </div>

                  <div class="footer">
                    <p>This email was sent to ${user.email} because an email change was requested for your RankdSEO account.</p>
                    <p>© ${new Date().getFullYear()} RankdSEO. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        return {
          success: true,
          message: 'Verification email sent to your current email address. Please check your inbox.',
          requiresVerification: true,
        };
      }

      // Update name only (no email change)
      if (name) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { name },
        });
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        requiresVerification: false,
      };
    }),

  // Verify email change
  verifyEmailChange: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tokenRecord = await ctx.prisma.emailChangeToken.findUnique({
        where: { token: input.token },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired verification token',
        });
      }

      if (tokenRecord.expires < new Date()) {
        await ctx.prisma.emailChangeToken.delete({
          where: { id: tokenRecord.id },
        });
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Verification token has expired. Please request a new email change.',
        });
      }

      // Update user email
      await ctx.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { email: tokenRecord.newEmail },
      });

      // Delete the token
      await ctx.prisma.emailChangeToken.delete({
        where: { id: tokenRecord.id },
      });

      // Send confirmation email to NEW email
      await sendEmail({
        to: tokenRecord.newEmail,
        subject: '✅ Email Address Changed Successfully - RankdSEO',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">✅ Email Changed Successfully</h1>
              </div>
              <div class="content">
                <p>Hello ${tokenRecord.user.name || 'User'},</p>
                
                <div class="success">
                  <p><strong>Your email address has been successfully updated!</strong></p>
                </div>

                <p><strong>Old Email:</strong> ${tokenRecord.user.email}</p>
                <p><strong>New Email:</strong> ${tokenRecord.newEmail}</p>
                <p><strong>Changed:</strong> ${new Date().toLocaleString()}</p>

                <p>You can now use this email address to sign in to your RankdSEO account.</p>

                <p>If you did not make this change, please contact our support immediately.</p>

                <div class="footer">
                  <p>© ${new Date().getFullYear()} RankdSEO. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return { success: true, message: 'Email address changed successfully' };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input;
      const userId = ctx.session.user.id;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await ctx.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  // Preferences Management
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    let preferences = await ctx.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await ctx.prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        notifyNewOpportunities: z.boolean().optional(),
        notifyLinkVerification: z.boolean().optional(),
        notifySubscriptionChanges: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const preferences = await ctx.prisma.userPreferences.upsert({
        where: { userId },
        update: input,
        create: {
          userId,
          ...input,
        },
      });

      return preferences;
    }),

  // Account Deletion - SECURE VERSION
  requestAccountDeletion: protectedProcedure
    .input(z.object({ currentPassword: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(input.currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Generate deletion token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Delete any existing deletion tokens
      await ctx.prisma.accountDeletionToken.deleteMany({
        where: { userId },
      });

      // Create deletion token
      await ctx.prisma.accountDeletionToken.create({
        data: {
          token,
          expires,
          userId,
        },
      });

      // Send confirmation email
      const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const confirmUrl = `${origin}/confirm-account-deletion?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: '⚠️ Confirm Account Deletion - RankdSEO',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; padding: 15px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              .warning { color: #dc2626; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">⚠️ Account Deletion Request</h1>
              </div>
              <div class="content">
                <p>Hello ${user.name || 'User'},</p>
                
                <div class="alert">
                  <p class="warning">⚠️ PERMANENT ACTION WARNING</p>
                  <p>You have requested to permanently delete your RankdSEO account.</p>
                </div>

                <p><strong>What will be deleted:</strong></p>
                <ul>
                  <li>Your account and profile information</li>
                  <li>All your projects and campaigns</li>
                  <li>Your subscription and billing history</li>
                  <li>All saved opportunities and data</li>
                </ul>

                <p><strong>This action CANNOT be undone.</strong></p>

                <p>If you're sure you want to proceed, click the button below:</p>

                <div style="text-align: center;">
                  <a href="${confirmUrl}" class="button">Confirm Account Deletion</a>
                </div>

                <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #ef4444;">${confirmUrl}</p>

                <div class="alert">
                  <p class="warning">Changed your mind?</p>
                  <p>Simply ignore this email and your account will remain active. This deletion link will expire in 24 hours.</p>
                </div>

                <div class="footer">
                  <p>© ${new Date().getFullYear()} RankdSEO. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return {
        success: true,
        message: 'Confirmation email sent. Please check your inbox to complete account deletion.',
      };
    }),

  // Confirm account deletion
  confirmAccountDeletion: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tokenRecord = await ctx.prisma.accountDeletionToken.findUnique({
        where: { token: input.token },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired deletion token',
        });
      }

      if (tokenRecord.expires < new Date()) {
        await ctx.prisma.accountDeletionToken.delete({
          where: { id: tokenRecord.id },
        });
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Deletion token has expired. Please request account deletion again.',
        });
      }

      const userEmail = tokenRecord.user.email;
      const userName = tokenRecord.user.name || 'User';

      // Delete user (cascade will handle related data)
      await ctx.prisma.user.delete({
        where: { id: tokenRecord.userId },
      });

      // Send final confirmation email
      await sendEmail({
        to: userEmail,
        subject: '👋 Account Deleted - RankdSEO',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">👋 Account Deleted</h1>
              </div>
              <div class="content">
                <p>Hello ${userName},</p>
                
                <p>Your RankdSEO account has been permanently deleted as requested.</p>

                <p><strong>Deleted:</strong> ${new Date().toLocaleString()}</p>

                <p>All your data, projects, and subscription information have been removed from our system.</p>

                <p>We're sorry to see you go. If you change your mind, you're welcome to create a new account anytime.</p>

                <p>Thank you for using RankdSEO!</p>

                <div class="footer">
                  <p>© ${new Date().getFullYear()} RankdSEO. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return { success: true, message: 'Account deleted successfully' };
    }),

  // Legacy deleteAccount endpoint (deprecated - redirects to secure version)
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Account deletion now requires password confirmation. Please use the secure deletion process.',
    });
  }),
});
