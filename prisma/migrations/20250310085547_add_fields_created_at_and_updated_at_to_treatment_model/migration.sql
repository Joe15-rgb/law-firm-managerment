/*
  Warnings:

  - Added the required column `updatedAt` to the `Treatment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `legalcase` MODIFY `caseNumber` INTEGER NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `treatment` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
