-- AlterTable
ALTER TABLE "BacklinkOpportunity" ADD COLUMN     "citationFlow" INTEGER,
ADD COLUMN     "referringDomains" INTEGER,
ADD COLUMN     "totalBacklinks" INTEGER,
ADD COLUMN     "trafficValue" INTEGER,
ADD COLUMN     "trustFlow" INTEGER;
