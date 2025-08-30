/*
  Warnings:

  - You are about to drop the column `saleswomanName` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `saleswomanId` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "saleswomanName",
ADD COLUMN     "saleswomanId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "saleswomen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "saleswomen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saleswomen_name_key" ON "saleswomen"("name");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_saleswomanId_fkey" FOREIGN KEY ("saleswomanId") REFERENCES "saleswomen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
