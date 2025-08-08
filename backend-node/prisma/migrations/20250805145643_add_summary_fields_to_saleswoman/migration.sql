-- AlterTable
ALTER TABLE "saleswomen" ADD COLUMN     "summaryGenerationsToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "summaryLastGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "summaryLastGenerationDate" TIMESTAMP(3),
ADD COLUMN     "summaryPdfPath" TEXT;
