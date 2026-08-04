-- ========================================
-- RankdSEO Production Database Seed
-- Run this in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUMS (skip if they exist)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LinkType" AS ENUM ('PROFILE', 'DIRECTORY', 'GUEST_POST', 'FORUM', 'SOCIAL', 'ARTICLE_SUBMISSION', 'BLOG_COMMENT', 'WEB_2_0', 'Q_AND_A', 'BUSINESS_LISTING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OpportunityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'NEEDS_REVIEW', 'BROKEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- Create Tables (if they don't exist)
-- ========================================

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "expirationEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "BacklinkOpportunity" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    "monthlyTraffic" INTEGER,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'ACTIVE',
    "slug" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Instruction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "opportunityId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Instruction_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "BacklinkOpportunity"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "niche" TEXT,
    "targetCountry" TEXT,
    "targetLanguage" TEXT,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "BacklinkOpportunity_slug_idx" ON "BacklinkOpportunity"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");

-- ========================================
-- Insert Seed Data
-- ========================================

-- Insert Plans
INSERT INTO "Plan" (id, name, description, price, interval, "maxOpportunities", "maxProjects", "allowExport", "allowApiAccess", priority, "isActive", features)
VALUES 
(
    'plan_free',
    'Free Plan',
    'Try out our platform with limited access',
    0,
    'month',
    20,
    1,
    false,
    false,
    -1,
    true,
    '{"opportunities": "20 opportunities", "projects": 1, "export": false, "apiAccess": false, "support": "Community", "tutorials": "Basic Access"}'::jsonb
),
(
    'plan_weekly',
    'Weekly Membership',
    'Most flexible - Full access billed weekly with 3-day free trial',
    749,
    'week',
    1000,
    100,
    true,
    true,
    1,
    true,
    '{"opportunities": "Unlimited", "projects": 100, "export": true, "apiAccess": true, "support": "Priority Email", "autoVerification": true, "tutorials": "Full Access", "trial": "3-day free trial", "flexible": true}'::jsonb
),
(
    'plan_monthly',
    'Monthly Membership',
    'Full access to all backlink opportunities - billed monthly',
    3499,
    'month',
    1000,
    100,
    true,
    true,
    0,
    true,
    '{"opportunities": "Unlimited", "projects": 100, "export": true, "apiAccess": true, "support": "Priority Email", "autoVerification": true, "tutorials": "Full Access"}'::jsonb
),
(
    'plan_yearly',
    '1 Year Membership',
    'Best value - Save 76% with annual billing',
    9999,
    'year',
    1000,
    100,
    true,
    true,
    2,
    true,
    '{"opportunities": "Unlimited", "projects": 100, "export": true, "apiAccess": true, "support": "Priority Email", "autoVerification": true, "tutorials": "Full Access", "bestValue": true}'::jsonb
),
(
    'plan_lifetime',
    'Lifetime Membership',
    'Pay once, access forever - unlimited everything',
    17999,
    'lifetime',
    1000,
    100,
    true,
    true,
    3,
    true,
    '{"opportunities": "Unlimited", "projects": 100, "export": true, "apiAccess": true, "support": "Priority Support", "autoVerification": true, "tutorials": "Full Access", "updates": "Lifetime Updates"}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Insert Admin User
-- Password: "password" (bcrypt hashed)
INSERT INTO "User" (id, email, password, name, role, "accountStatus", "emailVerified")
VALUES (
    'user_admin',
    'admin@rankseo.com',
    '$2b$10$yUxsPAzFYBuWAS3s4oA/k.KoFNDc4rTMiPdQz58aHCWB9H0c64Rv6',
    'Admin User',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Insert Test User  
INSERT INTO "User" (id, email, password, name, role, "accountStatus", "emailVerified")
VALUES (
    'user_test',
    'toms@uprankd.com',
    '$2b$10$yUxsPAzFYBuWAS3s4oA/k.KoFNDc4rTMiPdQz58aHCWB9H0c64Rv6',
    'Toms Test',
    'USER',
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Insert Demo User
INSERT INTO "User" (id, email, password, name, role, "accountStatus", "emailVerified")
VALUES (
    'user_demo',
    'demo@rankdseo.com',
    '$2b$10$yUxsPAzFYBuWAS3s4oA/k.KoFNDc4rTMiPdQz58aHCWB9H0c64Rv6',
    'Demo User',
    'USER',
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Create Subscriptions for Users
INSERT INTO "Subscription" (id, "userId", "planId", status, "currentPeriodStart", "currentPeriodEnd")
VALUES 
(
    'sub_admin',
    'user_admin',
    'plan_lifetime',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '100 years'
),
(
    'sub_test',
    'user_test',
    'plan_free',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year'
),
(
    'sub_demo',
    'user_demo',
    'plan_free',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year'
)
ON CONFLICT ("userId") DO NOTHING;

-- Insert Backlink Opportunities
INSERT INTO "BacklinkOpportunity" (id, url, "siteName", "shortDescription", "fullDescription", category, niche, language, "linkType", "isFree", "difficultyLevel", "domainAuthority", "domainRating", slug, status)
VALUES
('opp_linkedin', 'https://www.linkedin.com/pulse/', 'LinkedIn Pulse', 'Publish professional articles on LinkedIn', 'LinkedIn Pulse allows you to publish long-form articles to share your professional expertise with your network and beyond.', 'Professional Networks', 'Business', 'en', 'ARTICLE_SUBMISSION', true, 2, 98, 97, 'linkedin-pulse', 'ACTIVE'),
('opp_medium', 'https://medium.com/', 'Medium', 'Popular blogging platform for thought leadership', 'Medium is a popular publishing platform where you can share your stories and ideas with millions of readers.', 'Blogging Platforms', 'General', 'en', 'ARTICLE_SUBMISSION', true, 1, 95, 94, 'medium', 'ACTIVE'),
('opp_github', 'https://github.com/', 'GitHub Profile', 'Developer profile with project showcase', 'Create a detailed GitHub profile to showcase your projects and contribute to open source.', 'Developer Platforms', 'Technology', 'en', 'PROFILE', true, 1, 96, 96, 'github-profile', 'ACTIVE'),
('opp_dev', 'https://dev.to/', 'DEV Community', 'Developer community and blogging platform', 'DEV is a community of software developers getting together to help one another out.', 'Developer Communities', 'Technology', 'en', 'ARTICLE_SUBMISSION', true, 1, 90, 87, 'dev-community', 'ACTIVE'),
('opp_stackoverflow', 'https://stackoverflow.com/', 'Stack Overflow Profile', 'Q&A profile for developers', 'Stack Overflow is the largest online community for programmers to learn and share their knowledge.', 'Q&A Sites', 'Technology', 'en', 'PROFILE', true, 2, 97, 95, 'stack-overflow-profile', 'ACTIVE'),
('opp_growthhackers', 'https://growthhackers.com/', 'GrowthHackers', 'Marketing and growth community', 'GrowthHackers is a community for growth professionals to share tactics and strategies.', 'Marketing Communities', 'Marketing', 'en', 'FORUM', true, 2, 68, 70, 'growthhackers', 'ACTIVE'),
('opp_inbound', 'https://inbound.org/', 'Inbound.org', 'Inbound marketing community', 'Inbound.org is a community of marketers sharing knowledge about inbound marketing.', 'Marketing Communities', 'Marketing', 'en', 'FORUM', true, 2, 72, 71, 'inbound-org', 'ACTIVE'),
('opp_crunchbase', 'https://www.crunchbase.com/', 'Crunchbase', 'Business and startup database profile', 'Crunchbase is a platform for finding business information about private and public companies.', 'Business Directories', 'Business', 'en', 'BUSINESS_LISTING', true, 2, 92, 91, 'crunchbase', 'ACTIVE'),
('opp_producthunt', 'https://www.producthunt.com/', 'Product Hunt', 'Launch and discover new products', 'Product Hunt is a website that lets users share and discover new products.', 'Product Discovery', 'Technology', 'en', 'BUSINESS_LISTING', true, 2, 87, 86, 'product-hunt', 'ACTIVE'),
('opp_reddit', 'https://www.reddit.com/', 'Reddit', 'Community-driven discussion platform', 'Reddit is a network of communities based on people''s interests.', 'Social Networks', 'General', 'en', 'SOCIAL', true, 3, 96, 96, 'reddit', 'ACTIVE'),
('opp_quora', 'https://www.quora.com/', 'Quora', 'Q&A platform for knowledge sharing', 'Quora is a place to gain and share knowledge, empowering people to learn from others.', 'Q&A Sites', 'General', 'en', 'Q_AND_A', true, 2, 93, 92, 'quora', 'ACTIVE'),
('opp_about_me', 'https://about.me/', 'About.me', 'Personal landing page profile', 'About.me is a simple, beautiful way to show the world who you are.', 'Personal Branding', 'General', 'en', 'PROFILE', true, 1, 77, 76, 'about-me', 'ACTIVE'),
('opp_behance', 'https://www.behance.net/', 'Behance', 'Creative portfolio showcase', 'Behance is the world''s largest creative network for showcasing and discovering creative work.', 'Creative Portfolios', 'Design', 'en', 'PROFILE', true, 1, 89, 88, 'behance', 'ACTIVE'),
('opp_dribbble', 'https://dribbble.com/', 'Dribbble', 'Designer portfolio and community', 'Dribbble is where designers gain inspiration, feedback, community, and jobs.', 'Creative Portfolios', 'Design', 'en', 'PROFILE', true, 2, 90, 89, 'dribbble', 'ACTIVE'),
('opp_yelp', 'https://www.yelp.com/', 'Yelp Business', 'Local business listing and reviews', 'Yelp connects people with great local businesses.', 'Business Directories', 'Local Business', 'en', 'BUSINESS_LISTING', true, 1, 94, 93, 'yelp-business', 'ACTIVE'),
('opp_trustpilot', 'https://www.trustpilot.com/', 'Trustpilot', 'Customer review platform', 'Trustpilot is a review platform that helps businesses build trust with customers.', 'Review Sites', 'Business', 'en', 'BUSINESS_LISTING', true, 2, 85, 84, 'trustpilot', 'ACTIVE'),
('opp_angellist', 'https://wellfound.com/', 'AngelList (Wellfound)', 'Startup jobs and fundraising platform', 'Wellfound (formerly AngelList Talent) is the best place for startups to hire.', 'Startup Platforms', 'Business', 'en', 'BUSINESS_LISTING', true, 2, 86, 85, 'angellist-wellfound', 'ACTIVE'),
('opp_tripadvisor', 'https://www.tripadvisor.com/', 'TripAdvisor Business Listing', 'Travel and tourism business listing', 'TripAdvisor is the world''s largest travel platform.', 'Travel Directories', 'Travel', 'en', 'BUSINESS_LISTING', true, 2, 91, 90, 'tripadvisor-business-listing', 'ACTIVE'),
('opp_academia', 'https://www.academia.edu/', 'Academia.edu', 'Academic research sharing platform', 'Academia.edu is a platform for academics to share research papers.', 'Academic Networks', 'Education', 'en', 'PROFILE', true, 2, 88, 87, 'academia-edu', 'ACTIVE'),
('opp_zillow', 'https://www.zillow.com/professional/', 'Zillow Professional Directory', 'Real estate professional directory', 'Zillow Professional Directory helps real estate agents build their online presence.', 'Real Estate Directories', 'Real Estate', 'en', 'BUSINESS_LISTING', true, 2, 92, 91, 'zillow-professional-directory', 'ACTIVE'),
('opp_healthline', 'https://www.healthline.com/', 'Healthline Guest Posts', 'Health and wellness content platform', 'Healthline is a trusted source of health information reaching millions of people.', 'Health & Wellness', 'Health', 'en', 'GUEST_POST', false, 4, 87, 86, 'healthline-guest-posts', 'ACTIVE')
ON CONFLICT (slug) DO NOTHING;

-- Insert Sample Instructions for a few opportunities
INSERT INTO "Instruction" ("opportunityId", "stepNumber", title, description)
VALUES
('opp_linkedin', 1, 'Create LinkedIn Account', 'Sign up for a LinkedIn account if you don''t have one already.'),
('opp_linkedin', 2, 'Complete Your Profile', 'Fill out your profile completely with professional information.'),
('opp_linkedin', 3, 'Navigate to Pulse', 'Click on "Write article" from your homepage.'),
('opp_linkedin', 4, 'Write Your Article', 'Create a professional, value-driven article in your niche.'),
('opp_linkedin', 5, 'Add Your Backlink', 'Include your website link naturally in the article content or bio.'),

('opp_medium', 1, 'Sign Up for Medium', 'Create a free Medium account using email or Google.'),
('opp_medium', 2, 'Click "Write"', 'Click the "Write" button in the top right corner.'),
('opp_medium', 3, 'Create Your Story', 'Write a compelling article relevant to your audience.'),
('opp_medium', 4, 'Add Your Link', 'Include your website link within the article or in your bio.'),
('opp_medium', 5, 'Publish', 'Click "Publish" and share with relevant publications.'),

('opp_github', 1, 'Create GitHub Account', 'Sign up at github.com with your email.'),
('opp_github', 2, 'Edit Your Profile', 'Click on your avatar → "Your profile" → "Edit profile".'),
('opp_github', 3, 'Add Website URL', 'Enter your website in the "Website" field.'),
('opp_github', 4, 'Complete Bio', 'Write a professional bio mentioning your expertise.'),
('opp_github', 5, 'Save Changes', 'Click "Save" to update your profile.')
ON CONFLICT DO NOTHING;

-- Insert Demo Project
INSERT INTO "Project" (id, "userId", name, domain, niche, "targetCountry", "targetLanguage", description, color)
VALUES (
    'project_demo',
    'user_demo',
    'Demo SEO Project',
    'example.com',
    'Marketing',
    'United States',
    'English',
    'Sample project to showcase the platform features',
    '#3B82F6'
)
ON CONFLICT DO NOTHING;

-- ========================================
-- Success Message
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Database seeded successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created:';
    RAISE NOTICE '   - 5 Subscription Plans (Free, Weekly, Monthly, Yearly, Lifetime)';
    RAISE NOTICE '   - 3 Users (Admin, Test, Demo)';
    RAISE NOTICE '   - 21 Backlink Opportunities';
    RAISE NOTICE '   - 15 Sample Instructions';
    RAISE NOTICE '   - 1 Demo Project';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Login Credentials:';
    RAISE NOTICE '   Email: admin@rankseo.com';
    RAISE NOTICE '   Password: password';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Change the admin password immediately!';
    RAISE NOTICE '';
END $$;
