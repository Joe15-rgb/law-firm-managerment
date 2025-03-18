/*
  Warnings:

  - You are about to alter the column `size` on the `document` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `document` MODIFY `size` INTEGER NULL;

-- AlterTable
ALTER TABLE `legalcase` MODIFY `caseNumber` INTEGER NULL AUTO_INCREMENT;
