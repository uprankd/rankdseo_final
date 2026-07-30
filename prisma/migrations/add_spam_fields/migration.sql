-- Add spam detection fields to SupportTicket
ALTER TABLE "SupportTicket" ADD COLUMN "isSpam" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SupportTicket" ADD COLUMN "spamScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SupportTicket" ADD COLUMN "spamReason" TEXT;

-- Create index for spam filtering
CREATE INDEX "SupportTicket_isSpam_idx" ON "SupportTicket"("isSpam");
