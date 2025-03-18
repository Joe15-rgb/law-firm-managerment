-- AlterTable
ALTER TABLE `document` ADD COLUMN `size` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `legalcase` MODIFY `caseNumber` INTEGER NULL AUTO_INCREMENT;
