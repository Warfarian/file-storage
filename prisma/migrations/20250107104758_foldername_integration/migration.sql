/*
  Warnings:

  - You are about to drop the column `fileName` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "fileName",
ADD COLUMN     "folderName" TEXT;
