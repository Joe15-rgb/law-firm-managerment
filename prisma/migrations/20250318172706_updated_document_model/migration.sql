/*
  Warnings:

  - Added the required column `title` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `document` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE `legalcase` MODIFY `caseNumber` INTEGER NULL AUTO_INCREMENT;
