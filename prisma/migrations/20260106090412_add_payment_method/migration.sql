-- AlterTable
ALTER TABLE "PaymentTransaction" ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'stripe';
