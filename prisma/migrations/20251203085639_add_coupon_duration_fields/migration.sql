-- CreateEnum
CREATE TYPE "CouponDurationType" AS ENUM ('ONCE', 'REPEATING', 'FOREVER');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "applyToRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "durationInMonths" INTEGER,
ADD COLUMN     "durationType" "CouponDurationType" NOT NULL DEFAULT 'ONCE';
