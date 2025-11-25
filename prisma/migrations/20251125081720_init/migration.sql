-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('PROFILE', 'DIRECTORY', 'GUEST_POST', 'FORUM', 'SOCIAL', 'ARTICLE_SUBMISSION', 'BLOG_COMMENT', 'WEB_2_0', 'Q_AND_A', 'BUSINESS_LISTING');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'NEEDS_REVIEW', 'BROKEN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STATUS_CHANGE', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'OPPORTUNITY_ADDED', 'OPPORTUNITY_REMOVED', 'SUBSCRIPTION_CHANGED', 'NOTE_ADDED', 'EXPORT_GENERATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'month',
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "maxOpportunities" INTEGER NOT NULL DEFAULT 50,
    "maxProjects" INTEGER NOT NULL DEFAULT 1,
    "allowExport" BOOLEAN NOT NULL DEFAULT false,
    "allowApiAccess" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "niche" TEXT,
    "targetCountry" TEXT,
    "targetLanguage" TEXT,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklinkOpportunity" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT,
    "category" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "country" TEXT,
    "linkType" "LinkType" NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "cost" INTEGER,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "domainAuthority" INTEGER,
    "domainRating" INTEGER,
    "estimatedTraffic" INTEGER,
    "spamScore" INTEGER DEFAULT 0,
    "isDofollow" BOOLEAN NOT NULL DEFAULT true,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCheckedAt" TIMESTAMP(3),
    "metaData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BacklinkOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityInstruction" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepTitle" TEXT NOT NULL,
    "stepDescription" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "estimatedMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectOpportunity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "opportunityId" TEXT,
    "projectOpportunityId" TEXT,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_stripePriceId_key" ON "Plan"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_stripeProductId_key" ON "Plan"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "BacklinkOpportunity_category_idx" ON "BacklinkOpportunity"("category");

-- CreateIndex
CREATE INDEX "BacklinkOpportunity_niche_idx" ON "BacklinkOpportunity"("niche");

-- CreateIndex
CREATE INDEX "BacklinkOpportunity_language_idx" ON "BacklinkOpportunity"("language");

-- CreateIndex
CREATE INDEX "BacklinkOpportunity_linkType_idx" ON "BacklinkOpportunity"("linkType");

-- CreateIndex
CREATE INDEX "BacklinkOpportunity_status_idx" ON "BacklinkOpportunity"("status");

-- CreateIndex
CREATE INDEX "BacklinkOpportunity_domainAuthority_idx" ON "BacklinkOpportunity"("domainAuthority");

-- CreateIndex
CREATE INDEX "OpportunityInstruction_opportunityId_idx" ON "OpportunityInstruction"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityInstruction_opportunityId_stepOrder_key" ON "OpportunityInstruction"("opportunityId", "stepOrder");

-- CreateIndex
CREATE INDEX "ProjectOpportunity_projectId_idx" ON "ProjectOpportunity"("projectId");

-- CreateIndex
CREATE INDEX "ProjectOpportunity_opportunityId_idx" ON "ProjectOpportunity"("opportunityId");

-- CreateIndex
CREATE INDEX "ProjectOpportunity_status_idx" ON "ProjectOpportunity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectOpportunity_projectId_opportunityId_key" ON "ProjectOpportunity"("projectId", "opportunityId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_projectId_idx" ON "ActivityLog"("projectId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityInstruction" ADD CONSTRAINT "OpportunityInstruction_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "BacklinkOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOpportunity" ADD CONSTRAINT "ProjectOpportunity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOpportunity" ADD CONSTRAINT "ProjectOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "BacklinkOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "BacklinkOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectOpportunityId_fkey" FOREIGN KEY ("projectOpportunityId") REFERENCES "ProjectOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
